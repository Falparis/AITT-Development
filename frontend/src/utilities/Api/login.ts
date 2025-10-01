// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// export const login = async(updateToken,navigate,data,setLoader) => {

//     try {
//         const loginData = {
//             email: data.email,
//             password: data.password
//         }
//         axios.post(`${import.meta.env.VITE_STELLER_BACKEND}/auth/login`,loginData,{
//             headers: {
//                 'Accept': '*/*',
//                 'Content-Type': 'application/json'
//             }
//         })
//         .then((res)=>{
//             console.log("Success Response Signin : ",res);
//             localStorage.setItem('auth', res.data.data.access);
//             localStorage.setItem('role',res.data.data.role);
//             toast.success("Successfully LoggedIn!!!",{
//                 autoClose: 1500,
//                 theme: "light"
//             });
//             updateToken(res.data.data.access,res.data.data.role);
//         })
//         .catch((err)=>{
//             console.log("Error Response Signin : ",err);
//             toast.error(`${err.response.data.message || 'Error Authenticating'}!!!`,{
//                 autoClose: 1500,
//                 theme: "light"
//             })
//         }).finally(()=>{
//             setLoader(false);
//         })
//     } catch (error) {
//         console.log("Error Login : ",error);
//         setLoader(false);
        
//         toast.error(`${error.message}!!!`,{
//             autoClose: 1500,
//             theme: "light"
//         })
//     }
// }

// export const signup = async(navigate,data,setLoader) => {

//     try {
//         console.log(data);
        
//         const signupData = {
//             email: data.emailAddress,
//             password: data.password,
//             role: "company_admin",
//             company: {
//                 name: data.cName,
//                 contactEmail: data.cEmail
//             }
//         }
//         axios.post(`${import.meta.env.VITE_STELLER_BACKEND}/auth/register`,signupData,{
//             headers: {
//                 'Accept': '*/*',
//                 'Content-Type': 'application/json'
//             }
//         })
//         .then((res)=>{
//             console.log("Success Response Signup : ",res);
//             if(res.status == 201){
//                 toast.success("Successfully Registered!!!",{
//                     autoClose: 1500,
//                     theme: "light"
//                 });
//                 navigate("/signin")
//             }
//         })
//         .catch((err)=>{
//             console.log("Error Response Signup : ",err);
//             toast.error(`Error Registering!!!`,{
//                 autoClose: 1500,
//                 theme: "light"
//             })

//             // navigate('/verifydocument');
//         }).finally(()=>{
//             setLoader(false);
//         })
//     } catch (error) {
//         console.log("Error Signup : ",error);
//         setLoader(false);
//         toast.error(`${error.message}!!!`,{
//             autoClose: 1500,
//             theme: "light"
//         })
//     }
// }


import axios from "axios";
import { toast } from "react-toastify";

export const login = async (
  updateToken: any,
  data: any,
  setLoader: any
): Promise<void> => {
  try {
    setLoader(true);

    const loginData = {
      email: data.email,
      password: data.password,
    };

    const response = await axios.post<any>(
      `${import.meta.env.VITE_STELLER_BACKEND}/auth/login`,
      loginData,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Success Response Signin : ", response);
    localStorage.setItem("auth", response.data.data.access);
    localStorage.setItem("role", response.data.data.role);
    localStorage.setItem("mail", data.email);
    const now = new Date();
    localStorage.setItem('date', now.toISOString());
    toast.success("Successfully Logged In!!!", {
      autoClose: 1500,
      theme: "light",
    });
    updateToken(response.data.data.access, response.data.data.role, data.mail);
  } catch (error: any) {
    toast.error(`${error.response?.data.message || "Error Authenticating"}!!!`, {
      autoClose: 1500,
      theme: "light",
    });
    console.log("Error Response Signin : ", error);
  } finally {
    setLoader(false);
  }
};

export const signup = async (
  navigate: any,
  data: any,
  setLoader: any
): Promise<void> => {
  try {
    setLoader(true);

    const signupData = {
      email: data.emailAddress,
      password: data.password,
      role: "company_admin",
      company: {
        name: data.cName,
        contactEmail: data.cEmail,
      },
    };

    const response = await axios.post<any>(
      `${import.meta.env.VITE_STELLER_BACKEND}/auth/register`,
      signupData,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Success Response Signup : ", response);
    if (response.status === 201) {
      toast.success("Successfully Registered!!!", {
        autoClose: 1500,
        theme: "light",
      });
      navigate("/signin");
    }
  } catch (error: any) {
    toast.error(`Error Registering!!!`, {
      autoClose: 1500,
      theme: "light",
    });
    console.log("Error Response Signup : ", error);
  } finally {
    setLoader(false);
  }
};
