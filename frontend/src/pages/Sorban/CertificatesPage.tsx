import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Label from '../../components/form/Label';
// import BasicTableOne from '../../components/tables/BasicTables/BasicTableOne';
import CertificatesTable from '../../components/tables/BasicTables/CertificatesTable';

const CertificatesPage: React.FC = () => {

    const [files,setFiles] = useState([]);

    const getFiles = async() => {
        const URL = `${import.meta.env.VITE_STELLER_BACKEND}/certificates/admin/all`
        await axios.get(URL,{
            headers:{
                "Content-Type": "multipart/form-data",
                // "Authorization": `Bearer ${token}`
            }
        })
        .then((res)=>{
            console.log("Success Response File Show : ",res);
            setFiles(res.data.data);
        })
        .catch((err)=>{
            console.log("Error Response File Show : ",err);
        });
    }

    useEffect(()=>{
        getFiles();
    },[]);

  return (
    // <div className='min-h-screen pt-[48px]' style={{background: "linear-gradient(to top,#588157,#344e41)"}}>
    //   <main className="flex-grow py-12 px-4">
    //         <div className="container mx-auto">
                <div className="mx-auto">
                    <Label className='text-3xl md:text-4xl font-heading font-bold text-left mb-8'>Certificates</Label>
                    <CertificatesTable files={files} />
                </div>
    //         </div>
    //     </main>
    // </div>
  )
}

export default CertificatesPage;