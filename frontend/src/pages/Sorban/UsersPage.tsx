import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Label from '../../components/form/Label';
// import BasicTableOne from '../../components/tables/BasicTables/BasicTableOne';
// import CertificatesTable from '../../components/tables/BasicTables/CertificatesTable';
import { useAuthStore } from '../../utilities/zendex/AuthStore';
// import Button from '../../components/ui/button/Button';
import UsersTable from '../../components/tables/BasicTables/UsersTable';
import { useLocation } from 'react-router';

const UsersPage: React.FC = () => {

    const [users,setUsers] = useState({
        regulators: [],
        companyAdmins: []
    });
    const {token} = useAuthStore();
    const [loader,setLoader] = useState(false);
    // const [dataLoader,setDataLoader] = useState(false);
    const [selected,setSelected] = useState("RA");
    const location = useLocation();
    
    useEffect(()=>{
        if(location.pathname == "/users/ra"){
            setSelected("RA");
        }else if(location.pathname == "/users/ca"){
            setSelected("CA");
        }
    },[location]);

    const getRegulators = async() => {
        // setDataLoader(true);
        const URL = `${import.meta.env.VITE_STELLER_BACKEND}/regulators/users-grouped`
        await axios.get(URL,{
            headers:{
                // "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`
            }
        })
        .then((res)=>{
            console.log("Users : ",res.data.data);
            
            setUsers({
                regulators: res.data.data.regulatorAdmins,
                companyAdmins: res.data.data.companyAdmins
            })
        })
        .catch((err)=>{
            console.log("Error Response File Show : ",err);
        }).finally(()=>{
            // setDataLoader(false);
        });
    }

    useEffect(()=>{
        getRegulators();
    },[]);

  return (
    // <div className='min-h-screen pt-[48px]' style={{background: "linear-gradient(to top,#588157,#344e41)"}}>
    //   <main className="flex-grow py-12 px-4">
    //         <div className="container mx-auto">
                <div className="mx-auto">
                    {/* <div className='flex justify-center items-center gap-[10px]'>
                      <button className={`border text-xl font-heading font-bold ${selected == "RA" ? 'text-gray-50 dark:!text-gray-700 dark:!bg-gray-50 bg-gray-700' : 'border-gray-700 dark:!text-gray-50 dark:!bg-gray-700 !text-gray-700 bg-gray-50' } p-3 rounded text-center mb-8 hover:cursor-pointer`} onClick={()=>setSelected("RA")}>
                          Regulators
                      </button>
                      <button className={`border text-xl font-heading font-bold ${selected == "CA" ? 'text-gray-50 dark:!text-gray-700 dark:!bg-gray-50 bg-gray-700' : 'border-gray-700 dark:!text-gray-50 dark:!bg-gray-700 !text-gray-700 bg-gray-50' } p-3 rounded text-center mb-8 hover:cursor-pointer`} onClick={()=>setSelected("CA")}>
                          Non-Regulators
                      </button>
                    </div> */}
                    <Label className='text-3xl md:text-4xl font-heading font-bold text-left mb-8'>{location.pathname == "/users/ra" && "Regulators"}{location.pathname == "/users/ca" && "Non-Regulators"}</Label>
                    {selected == 'RA' && <UsersTable files={users?.regulators} getRegulators={getRegulators} loader={loader} setLoader={setLoader} />}
                    {selected == 'CA' && <UsersTable files={users?.companyAdmins} getRegulators={getRegulators} loader={loader} setLoader={setLoader} />}
                </div>
    //         </div>
    //     </main>
    // </div>
  )
}

export default UsersPage;