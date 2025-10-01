use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

declare_id!("6iVSKKvzjmfJi6WH1rw3rKb44pLizpKFwg81Bu3YgwhH");

// Supply & allocation
const INITIAL_SUPPLY: u64 = 4_000_000_000_000; // reward tokens added at init
const PER_SUB_ALLOCATION: u64 = 20_000_000_000; // reward tokens per subscription
const PER_SUB_PRICE_USDC: u64 = 10_000_000; // 100 USDC (6 decimals)
                                            // const INITIAL_SUPPLY: u64 = 40_000_000; // reward tokens added at init
                                            // const PER_SUB_ALLOCATION: u64 = 200_000; // reward tokens per subscription
                                            // const PER_SUB_PRICE_USDC: u64 = 100_000_000; // 100 USDC (6 decimals)

// Time constants
const SECS_PER_MONTH: i64 = 60;
// const SECS_PER_MONTH: i64 = 30 * 24 * 60 * 60;

// Vesting config
const CLIFF_MONTHS: u8 = 6; // 100% unlock after 6 months
const GRADUAL_CLIFF_MONTHS: u8 = 5; // initial lock period
const GRADUAL_TRANCHE_MONTHS: u8 = 1; // monthly tranches
const GRADUAL_TRANCHES: u8 = 4; // 4 tranches → 25% each

#[program]
pub mod rewards_pool_real_token {
    use super::*;

    /// Initialize the pool with reward + USDC vaults.
    pub fn init_pool(ctx: Context<InitPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        pool.authority = ctx.accounts.authority.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.usdc_mint = ctx.accounts.usdc_mint.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.usdc_vault = ctx.accounts.usdc_vault.key();

        // Accounting
        pool.total_reserved = 0;
        pool.total_claimed = 0;

        pool.next_sub_index = 0;
        pool.paused = false;
        pool.bump = ctx.bumps.pool;

        // Schedule config
        pool.cliff_months = CLIFF_MONTHS;
        pool.gradual_cliff_months = GRADUAL_CLIFF_MONTHS;
        pool.gradual_tranche_months = GRADUAL_TRANCHE_MONTHS;
        pool.gradual_tranches = GRADUAL_TRANCHES;

        // Snapshot SOL balance (optional)
        pool.usdc_balance = 0;

        // Pull initial reward tokens from authority → pool vault
        if INITIAL_SUPPLY > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.authority_reward_ata.to_account_info(),
                to: ctx.accounts.reward_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_ctx =
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::transfer(cpi_ctx, INITIAL_SUPPLY)?;
        }

        emit!(PoolInitialized {
            authority: pool.authority,
            reward_mint: pool.reward_mint,
            usdc_mint: pool.usdc_mint,
            initial_supply: INITIAL_SUPPLY,
            per_sub_allocation: PER_SUB_ALLOCATION,
            per_sub_price_usdc: PER_SUB_PRICE_USDC,
            cliff_months: pool.cliff_months,
            gradual_cliff_months: pool.gradual_cliff_months,
            gradual_tranche_months: pool.gradual_tranche_months,
            gradual_tranches: pool.gradual_tranches,
        });
        Ok(())
    }

    /// Subscribe: pay USDC and reserve reward allocation.
    pub fn subscribe(ctx: Context<Subscribe>, kind: SubKind) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(!pool.paused, ErrorCode::Paused);

        // Check reward vault balance
        let reward_vault_amount = ctx.accounts.reward_vault.amount;
        let available = reward_vault_amount
            .checked_sub(pool.total_reserved)
            .and_then(|x| x.checked_sub(pool.total_claimed))
            .ok_or(ErrorCode::MathOverflow)?;
        require!(
            PER_SUB_ALLOCATION <= available,
            ErrorCode::InsufficientPoolBalance
        );

        // Charge USDC
        if PER_SUB_PRICE_USDC > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_usdc_ata.to_account_info(),
                to: ctx.accounts.usdc_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            let cpi_ctx =
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::transfer(cpi_ctx, PER_SUB_PRICE_USDC)?;
            pool.usdc_balance += PER_SUB_PRICE_USDC;
        }

        let now = Clock::get()?.unix_timestamp;

        let s = &mut ctx.accounts.subscription;
        s.pool = pool.key();
        s.user = ctx.accounts.user.key();
        s.amount = PER_SUB_ALLOCATION;
        s.start_at = now;
        s.kind = kind as u8;
        s.claimed = false;
        s.claimed_amount = 0;
        s.index = pool.next_sub_index;

        // Unlock time calculation
        s.unlock_at = match kind {
            SubKind::Cliff => now
                .checked_add(months_to_secs(pool.cliff_months))
                .ok_or(ErrorCode::MathOverflow)?,
            SubKind::Gradual => now
                .checked_add(
                    months_to_secs(pool.gradual_cliff_months)
                        .checked_add(months_to_secs(pool.gradual_tranche_months))
                        .ok_or(ErrorCode::MathOverflow)?,
                ).ok_or(ErrorCode::MathOverflow)?,
        };

        pool.total_reserved = pool
            .total_reserved
            .checked_add(PER_SUB_ALLOCATION)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.next_sub_index = pool
            .next_sub_index
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(Subscribed {
            user: s.user,
            amount: s.amount,
            unlock_at: s.unlock_at,
            sub_index: s.index,
            kind: s.kind,
            price_usdc: PER_SUB_PRICE_USDC,
        });
        Ok(())
    }

    /// Claim vested reward tokens.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let s = &mut ctx.accounts.subscription;
        let user = &ctx.accounts.user;
        require!(!pool.paused, ErrorCode::Paused);
        require!(user.key() == s.user, ErrorCode::WrongClaimAccount);
        require!(s.pool == pool.key(), ErrorCode::WrongClaimAccount);

        let now = Clock::get()?.unix_timestamp;
        let vested = vested_amount(pool, s, now)?;
        require!(vested > s.claimed_amount, ErrorCode::NothingToClaim);

        let delta = vested
            .checked_sub(s.claimed_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // PDA signer
        let seeds: &[&[u8]] = &[b"pool2", pool.reward_mint.as_ref()];
        let bump = [pool.bump];
        let signer: &[&[&[u8]]] = &[&[seeds[0], seeds[1], &bump]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_reward_ata.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, delta)?;

        // Update subscription + pool accounting
        s.claimed_amount = vested;
        if s.claimed_amount >= s.amount {
            s.claimed = true;
        }

        pool.total_reserved = pool
            .total_reserved
            .checked_sub(delta)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.total_claimed = pool
            .total_claimed
            .checked_add(delta)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(Claimed {
            user: s.user,
            amount: delta
        });
        Ok(())
    }

    /// Admin: pause/unpause subscriptions.
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require_keys_eq!(
            pool.authority,
            ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        pool.paused = paused;
        emit!(PauseToggled { paused });
        Ok(())
    }

    /// Admin: withdraw USDC from pool's USDC vault.
    pub fn admin_withdraw_usdc(ctx: Context<AdminWithdrawUsdc>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(amount > 0, ErrorCode::ZeroAmount);
        require_keys_eq!(
            pool.authority,
            ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );

        // PDA signer seeds
        let seeds: &[&[u8]] = &[b"pool2", pool.reward_mint.as_ref()];
        let bump = [pool.bump];
        let signer: &[&[&[u8]]] = &[&[seeds[0], seeds[1], &bump]];

        // Transfer USDC from pool vault → admin ATA
        let cpi_accounts = Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.authority_usdc_ata.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );

        token::transfer(cpi_ctx, amount)?;
        pool.usdc_balance = pool
            .usdc_balance
            .checked_sub(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(AdminUsdcWithdrawn {
            to: ctx.accounts.authority.key(),
            amount
        });
        Ok(())
    }

    /// Close subscription after full claim.
    pub fn close_subscription(_ctx: Context<CloseSubscription>) -> Result<()> {
        Ok(())
    }
}

/* ---------------- Vesting Logic ---------------- */

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum SubKind {
    Cliff = 0,
    Gradual = 1,
}

fn months_to_secs(m: u8) -> i64 {
    (m as i64) * SECS_PER_MONTH
}

fn vested_amount(pool: &GlobalPool, s: &Subscription, now: i64) -> Result<u64> {
    let amount = s.amount;
    let start = s.start_at;

    match s.kind() {
        SubKind::Cliff => {
            let cliff_time = start
                .checked_add(months_to_secs(pool.cliff_months))
                .ok_or(ErrorCode::MathOverflow)?;
            if now >= cliff_time {
                Ok(amount)
            } else {
                Err(ErrorCode::StillLocked.into())
            }
        }
        SubKind::Gradual => {
            let first_tranche_time = start
                .checked_add(months_to_secs(pool.gradual_cliff_months))
                .and_then(|t| t.checked_add(months_to_secs(pool.gradual_tranche_months)))
                .ok_or(ErrorCode::MathOverflow)?;

            if now < first_tranche_time {
                return Err(ErrorCode::StillLocked.into());
            }

            let elapsed = now
                .checked_sub(first_tranche_time)
                .ok_or(ErrorCode::MathOverflow)?;
            let interval_secs = months_to_secs(pool.gradual_tranche_months);
            let tranches = (elapsed / interval_secs) as u64 + 1;
            let vested_tranches = tranches.min(pool.gradual_tranches as u64);

            let vested = amount
                .checked_mul(vested_tranches)
                .and_then(|x| x.checked_div(pool.gradual_tranches as u64))
                .ok_or(ErrorCode::MathOverflow)?;

            Ok(vested)
        }
    }
}

/* ---------------- Accounts ---------------- */

#[derive(Accounts)]
pub struct InitPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub reward_mint: Account<'info, Mint>,
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + GlobalPool::SIZE,
        seeds = [b"pool2", reward_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, GlobalPool>,

    #[account(
        mut,
        constraint = reward_vault.mint == reward_mint.key(),
        constraint = reward_vault.owner == pool.key(),
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = usdc_vault.mint == usdc_mint.key(),
        constraint = usdc_vault.owner == pool.key(),
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = authority_reward_ata.mint == reward_mint.key(),
        constraint = authority_reward_ata.owner == authority.key(),
    )]
    pub authority_reward_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// #[derive(Accounts)]
// pub struct FundPool<'info> {
//     #[account(mut, has_one = authority)]
//     pub pool: Account<'info, GlobalPool>,
//     #[account(mut)]
//     pub authority: Signer<'info>,

//     #[account(
//         mut,
//         constraint = reward_vault.key() == pool.reward_vault,
//         constraint = reward_vault.owner == pool.key(),
//         constraint = reward_vault.mint == pool.reward_mint,
//     )]
//     pub reward_vault: Account<'info, TokenAccount>,

//     #[account(
//         mut,
//         constraint = authority_reward_ata.mint == pool.reward_mint,
//         constraint = authority_reward_ata.owner == authority.key(),
//     )]
//     pub authority_reward_ata: Account<'info, TokenAccount>,

//     pub token_program: Program<'info, Token>,
// }

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, GlobalPool>,

    #[account(
        mut,
        constraint = reward_vault.key() == pool.reward_vault,
        constraint = reward_vault.mint == pool.reward_mint,
        constraint = reward_vault.owner == pool.key(),
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = usdc_vault.key() == pool.usdc_vault,
        constraint = usdc_vault.mint == pool.usdc_mint,
        constraint = usdc_vault.owner == pool.key(),
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_usdc_ata.mint == pool.usdc_mint,
        constraint = user_usdc_ata.owner == user.key(),
    )]
    pub user_usdc_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + Subscription::SIZE,
        seeds = [
            b"subscription",
            pool.key().as_ref(),
            &pool.next_sub_index.to_le_bytes()
        ],
        bump
    )]
    pub subscription: Account<'info, Subscription>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub pool: Account<'info, GlobalPool>,

    #[account(mut)]
    pub subscription: Account<'info, Subscription>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = reward_vault.key() == pool.reward_vault,
        constraint = reward_vault.mint == pool.reward_mint,
        constraint = reward_vault.owner == pool.key(),
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_reward_ata.mint == pool.reward_mint,
        constraint = user_reward_ata.owner == user.key(),
    )]
    pub user_reward_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, GlobalPool>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminWithdrawUsdc<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, GlobalPool>,
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = usdc_vault.key() == pool.usdc_vault,
        constraint = usdc_vault.mint == pool.usdc_mint,
        constraint = usdc_vault.owner == pool.key(),
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = authority_usdc_ata.mint == pool.usdc_mint,
        constraint = authority_usdc_ata.owner == authority.key(),
    )]
    pub authority_usdc_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseSubscription<'info> {
    #[account(mut, close = user, constraint = subscription.claimed @ ErrorCode::NotClaimed)]
    pub subscription: Account<'info, Subscription>,
    #[account(mut)]
    pub user: Signer<'info>,
}

/* ---------------- State ---------------- */

#[account]
pub struct GlobalPool {
    pub authority: Pubkey,

    pub reward_mint: Pubkey,
    pub reward_vault: Pubkey,
    pub usdc_mint: Pubkey,
    pub usdc_vault: Pubkey,

    pub total_reserved: u64,
    pub total_claimed: u64,

    pub next_sub_index: u64,
    pub paused: bool,
    pub bump: u8,
    pub usdc_balance: u64,

    pub cliff_months: u8,
    pub gradual_cliff_months: u8,
    pub gradual_tranche_months: u8,
    pub gradual_tranches: u8,
}
impl GlobalPool {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 8 + 1 + 1 + 1 + 1;
}

#[account]
pub struct Subscription {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub unlock_at: i64,
    pub claimed: bool,
    pub claimed_amount: u64,
    pub index: u64,
    pub start_at: i64,
    pub kind: u8,
}
impl Subscription {
    pub const SIZE: usize = 32 + 32 + 8 + 8 + 1 + 8 + 8 + 8 + 1;

    pub fn kind(&self) -> SubKind {
        match self.kind {
            0 => SubKind::Cliff,
            1 => SubKind::Gradual,
            _ => SubKind::Cliff,
        }
    }
}

/* ---------------- Events ---------------- */

#[event]
pub struct PoolInitialized {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub initial_supply: u64,
    pub per_sub_allocation: u64,
    pub per_sub_price_usdc: u64,
    pub cliff_months: u8,
    pub gradual_cliff_months: u8,
    pub gradual_tranche_months: u8,
    pub gradual_tranches: u8,
}

#[event]
pub struct PoolFunded {
    pub amount: u64,
}

#[event]
pub struct Subscribed {
    pub user: Pubkey,
    pub amount: u64,
    pub unlock_at: i64,
    pub sub_index: u64,
    pub kind: u8,
    pub price_usdc: u64,
}

#[event]
pub struct Claimed {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AdminUsdcWithdrawn {
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PauseToggled {
    pub paused: bool,
}

/* ---------------- Errors ---------------- */

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid schedule configuration")]
    InvalidConfig,
    #[msg("Amount must be > 0")]
    ZeroAmount,
    #[msg("Insufficient pool balance")]
    InsufficientPoolBalance,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Subscription still locked")]
    StillLocked,
    #[msg("Already fully claimed or nothing new to claim")]
    NothingToClaim,
    #[msg("Not claimed yet")]
    NotClaimed,
    #[msg("Account mismatch")]
    WrongClaimAccount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Subscriptions are paused")]
    Paused,
}
