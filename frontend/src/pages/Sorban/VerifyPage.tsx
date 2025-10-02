import React, {  useState } from 'react'
import { Upload, Check , X} from "lucide-react"
import axios from 'axios'
import Input from '../../components/form/input/InputField'
import Label from '../../components/form/Label'
import { useAuthStore } from '../../utilities/zendex/AuthStore'

const VerifyPage: React.FC =  ()  => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [verificationStatus, setVerificationStatus] = useState("idle")
    const {role} = useAuthStore();
    const [resMsg,setResMsg] = useState("");
    const [data,setData] = useState({
        name: "",
        subject: "",
    })

    const [error,setError] = useState({
        name: "",
        subject: "",
    })

    const handleFileUpload = (e:any) => {
        console.log("Files : ",e);
        
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0])
            setVerificationStatus("idle")
        }
    }

    const handleDrop = (e:any) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            setUploadedFile(droppedFiles[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleDragOver = (e:any) => {
        e.preventDefault();
        e.stopPropagation();
        // Optionally add visual feedback for drag over
    };

    const handleVerify = async(state:any) => {
        if (!uploadedFile) return

        setVerificationStatus("verifying")

        const token = localStorage.getItem("auth");

        let URL = "";
        let headers;

        if(state == "verify"){
            URL = `${import.meta.env.VITE_STELLER_BACKEND}/certificates/check`;
            headers = {
                "Content-Type": "multipart/form-data"
            };
        }else if(state == "upload"){
            URL = `${import.meta.env.VITE_STELLER_BACKEND}/certificates`;
            headers = {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`
            }
        }

        await axios.post(URL,{
            file: uploadedFile,
            certificateName: data.name,
            subject: data.subject
        },{
            headers
        })
        .then((res)=>{
            console.log("Success Response File Verification : ",res);
            if(state == "verify"){
                if(res.data.issued){
                    setResMsg("Verification successful.")
                    setVerificationStatus("success");
                }else{
                    setResMsg("Verification Failed")
                    setVerificationStatus("failure");
                }
            }else if(state == "upload"){
                if(res.data.success){
                    setResMsg("Uploaded Successfully.")
                    setVerificationStatus("success");
                }else{
                    setResMsg("Failed To Upload.")
                    setVerificationStatus("failure");
                }
            }
        })
        .catch((err)=>{
            console.log("Error Response File Verification : ",err);
            setResMsg(err.response.data.message);
            setVerificationStatus("error")
        });
    }

    return (
        // <div className="flex flex-col min-h-screen pt-[48px]" style={{background: "linear-gradient(to top,#588157,#344e41)"}}>
        //     <main className="flex-grow py-12 px-4">
        //         <div className="container mx-auto">
                    <div className="mx-auto">
                        <Label htmlFor="inputTwo" className='text-3xl md:text-4xl font-heading font-bold text-center mb-8'>{(role == "super_admin" || role == "regulator_admin") ? "Upload/Verify Documnents" : "Verify Documnents"}</Label>

                        <div className=" rounded-lg shadow-md overflow-hidden mb-12 border border-[#80808060]">
                            <div className="p-6">
                                <div className="space-y-8">
                                    <div className="dark:bg-gray-900 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        {!uploadedFile ? (
                                            <div onDrop={handleDrop} onDragOver={handleDragOver}>
                                                <Upload className="h-12 w-12 text-gray-700 dark:text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-400 mb-2">Upload Document</h3>
                                                <p className="text-gray-700 dark:text-gray-400 mb-4">Drag and drop your file here, or click to browse</p>
                                                <input type="file" id="document-upload" className='hidden' onChange={handleFileUpload} />
                                                <label
                                                    onClick={handleFileUpload}
                                                    htmlFor="document-upload"
                                                    className="transition-all inline-block border dark:hover:bg-gray-900 hover:bg-gray-700 border-gray-700 text-gray-700 dark:text-gray-400 dark:border-gray-400 hover:text-[#dad7cd] px-4 py-2 rounded-md cursor-pointer"
                                                >
                                                    Select File
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-center space-x-2 text-wrap">
                                                    <div className="p-2 bg-gray-700 dark:bg-gray-400 rounded-full">
                                                        <Check className="h-6 w-6 text-gray-50 dark:text-gray-700" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 dark:text-gray-400">{uploadedFile.name}</span>
                                                </div>

                                                {verificationStatus === "idle" && (
                                                    <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
                                                        {/* <button onClick={() => handleVerify("verify")} className="border border-gray-900 hover:bg-gray-700 hover:text-gray-25 dark:text-gray-25 dark:hover:bg-gray-900 rounded-[6px] py-[0.75rem] px-[1.5rem] font-semibold transition-all inline-block text-center hover:cursor-pointer">
                                                            Verify Document
                                                        </button> */}
                                                        {/* {(role == "super_admin" || role == "regulator_admin")  && <button onClick={() =>{
                                                            let error;
                                                            if(data.name == ""){
                                                                setError(prev => ({...prev,name: "Enter Name"}));
                                                                error = true;
                                                            }
                                                            if(data.subject == ""){
                                                                setError(prev => ({...prev,subject: "Enter Subject"}));
                                                                error = true;
                                                            }
                                                            if(error == true) return; 
                                                            handleVerify("upload");
                                                        }} className="border border-gray-900 hover:bg-gray-700 hover:text-gray-25 dark:text-gray-25 dark:hover:bg-gray-900 rounded-[6px] py-[0.75rem] px-[1.5rem] font-semibold transition-all inline-block text-center hover:cursor-pointer">
                                                            Upload Document
                                                        </button>} */}
                                                    </div>
                                                )}

                                                {verificationStatus === "verifying" && (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-r-2 border-gray-700 dark:border-gray-50 border-usl-blue"></div>
                                                        {/* <span>Verifying...</span> */}
                                                    </div>
                                                )}

                                                {(verificationStatus === "success" || verificationStatus === "failure" || verificationStatus === "error")  && (
                                                    <div className="space-y-2">
                                                        <div className={`flex items-center justify-center space-x-2 text-[#344e41]`}>
                                                            {verificationStatus === "success" ? <Check className="h-5 w-5 text-gray-700 dark:text-gray-50" /> : <X className="h-5 w-5 text-gray-700 dark:text-gray-50" />}
                                                            <span className="font-medium text-gray-700 dark:text-gray-50">{resMsg}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setUploadedFile(null)
                                                                setVerificationStatus("idle")
                                                            }}
                                                            className="border border-gray-900 hover:bg-gray-700 hover:text-gray-25 dark:bg-gray-700 dark:text-gray-25 dark:hover:bg-gray-50 dark:hover:text-gray-700 rounded-[6px] py-[0.75rem] px-[1.5rem] font-semibold transition-all inline-block text-center hover:cursor-pointer"
                                                        >
                                                            Upload another document
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col items-start justify-center p-6 min-w-full'>
                                <div className='min-w-full'>
                                    <Label htmlFor="inputTwo">Certificate Name{error.name != "" && <span className='text-red-500'>*</span>}</Label>
                                    <Input type="text" id="inputTwo" placeholder="Test" className='min-w-full' value={data?.name} onChange={(e)=>{
                                        setData(prev => ({...prev,name: e.target.value}));
                                        setError(prev => ({...prev,name: ""}));
                                    }} />
                                </div>
                                <div className='min-w-full'>
                                    <Label htmlFor="inputTwo">Subject{error.subject != "" && <span className='text-red-500'>*</span>}</Label>
                                    <Input type="text" id="inputTwo" placeholder="Test" className='min-w-full' value={data?.subject} onChange={(e)=>{
                                        setData(prev => ({...prev,subject: e.target.value}));
                                        setError(prev => ({...prev,subject: ""}));
                                    }}/>
                                </div>
                            </div>
                            <div className='w-full p-6 flex items-end justify-end gap-4'>
                                <button onClick={() => handleVerify("verify")} className="border border-gray-900 hover:bg-gray-700 hover:text-gray-25 dark:bg-gray-700 dark:text-gray-25 dark:hover:bg-gray-50 dark:hover:text-gray-700 rounded-[6px] py-[0.75rem] px-[1.5rem] font-semibold transition-all inline-block text-center hover:cursor-pointer">
                                    Verify
                                </button>
                                {(role == "super_admin" || role == "regulator_admin")  && <button onClick={() =>{
                                    let error;
                                    if(data.name == ""){
                                        setError(prev => ({...prev,name: "Enter Name"}));
                                        error = true;
                                    }
                                    if(data.subject == ""){
                                        setError(prev => ({...prev,subject: "Enter Subject"}));
                                        error = true;
                                    }
                                    if(error == true) return; 
                                    handleVerify("upload");
                                }} className="border border-gray-900 hover:bg-gray-700 hover:text-gray-25 dark:bg-gray-700 dark:text-gray-25 dark:hover:bg-gray-50 dark:hover:text-gray-700 rounded-[6px] py-[0.75rem] px-[1.5rem] font-semibold transition-all inline-block text-center hover:cursor-pointer">
                                    Add
                                </button>}
                            </div>
                        </div>
                    </div>
        //         </div>
        //     </main>
        // </div>
    )
}

export default VerifyPage