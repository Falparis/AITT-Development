import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

// import Badge from "../../ui/badge/Badge";
import { useAuthStore } from "../../../utilities/zendex/AuthStore";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// interface Order {
//   id: number;
//   user: {
//     image: string;
//     name: string;
//     role: string;
//   };
//   projectName: string;
//   team: {
//     images: string[];
//   };
//   status: string;
//   budget: string;
// }

// Define the table data using the interface
// const tableData: Order[] = [
//   {
//     id: 1,
//     user: {
//       image: "/images/user/user-17.jpg",
//       name: "Lindsey Curtis",
//       role: "Web Designer",
//     },
//     projectName: "Agency Website",
//     team: {
//       images: [
//         "/images/user/user-22.jpg",
//         "/images/user/user-23.jpg",
//         "/images/user/user-24.jpg",
//       ],
//     },
//     budget: "3.9K",
//     status: "Active",
//   },
//   {
//     id: 2,
//     user: {
//       image: "/images/user/user-18.jpg",
//       name: "Kaiya George",
//       role: "Project Manager",
//     },
//     projectName: "Technology",
//     team: {
//       images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"],
//     },
//     budget: "24.9K",
//     status: "Pending",
//   },
//   {
//     id: 3,
//     user: {
//       image: "/images/user/user-17.jpg",
//       name: "Zain Geidt",
//       role: "Content Writing",
//     },
//     projectName: "Blog Writing",
//     team: {
//       images: ["/images/user/user-27.jpg"],
//     },
//     budget: "12.7K",
//     status: "Active",
//   },
//   {
//     id: 4,
//     user: {
//       image: "/images/user/user-20.jpg",
//       name: "Abram Schleifer",
//       role: "Digital Marketer",
//     },
//     projectName: "Social Media",
//     team: {
//       images: [
//         "/images/user/user-28.jpg",
//         "/images/user/user-29.jpg",
//         "/images/user/user-30.jpg",
//       ],
//     },
//     budget: "2.8K",
//     status: "Cancel",
//   },
//   {
//     id: 5,
//     user: {
//       image: "/images/user/user-21.jpg",
//       name: "Carla George",
//       role: "Front-end Developer",
//     },
//     projectName: "Website",
//     team: {
//       images: [
//         "/images/user/user-31.jpg",
//         "/images/user/user-32.jpg",
//         "/images/user/user-33.jpg",
//       ],
//     },
//     budget: "4.5K",
//     status: "Active",
//   },
// ];

export default function UsersTable({files,loader,setLoader,getRegulators} : any) {

  const {token} = useAuthStore();
  const [id,setId] = useState("");

  const handlePromote = async(ID:any,isRegulator:any) => {
        setId(ID);
        setLoader(true);
        let URL;
        if(isRegulator){
          URL = `${import.meta.env.VITE_STELLER_BACKEND}/regulators/demote`
        }else{
          URL = `${import.meta.env.VITE_STELLER_BACKEND}/regulators/promote`
        }
        await axios.post(URL,{
            userId: ID
        },{
            headers:{
                // "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`
            }
        })
        .then((res)=>{
            console.log("Success Promote : ",res);
            if(isRegulator){
                toast.success("Revoked Regulator Access!!!",{
                    theme: 'light',
                    autoClose: 1500
                });
            }else{
                toast.success("Promoted To Regulator!!!",{
                    theme: 'light',
                    autoClose: 1500
                });
            }
            getRegulators();
        })
        .catch((err)=>{
            console.log("Error Promote : ",err);
        }).finally(()=>{
          setLoader(false);
          setId("");
        })
    }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[10%]">
          {files.length == 0 && 
            <div className='min-w-[40vw] pl-[50%] pt-5 pb-5'>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-r-2"></div>
            </div>
          }
          {files.length != 0 && <Table className="min-w-full">
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Company Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Company Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {files?.map((order:any) => (
                <TableRow key={order?.txHash} className="">
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order?.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order?.companyData?.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order?.companyData?.contactEmail}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">
                    <button onClick={()=>handlePromote(order?._id,order.isRegulator)} className='min-w-[100%] transition-all inline-block border px-2 py-2 rounded-md cursor-pointer'>{(loader && id == order?._id) ? <div className='w-[100%] pl-[50%]'><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-r-2"></div></div> : order?.isRegulator ? 'Revoke Regulator Access' : 'Promote to Regulator'}</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
        </div>
      </div>
    </div>
  );
}
