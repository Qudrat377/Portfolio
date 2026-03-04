// import { useEffect, useState } from "react";
// import { quotes } from "../assets";
// import { feedbacks } from "../Util/constants";

// function FeedbackCard({ id, content, name, title, image, idx }) {
//   const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     getData();
//   }, []);

//   const getData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("http://localhost:4039/get_all_WorkProjects", {
//         method: "GET",
//         headers: {
//           "Content-type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Ma'lumot olishda xatolik yuz berdi");
//       }

//       const info = await response.json();

//       if (Array.isArray(info) && info.length > 0) {
//         setData(info);
//       } else {
//         setData([]);
//       }
//     } catch (error) {
//       console.error("Xato:", error.message);
//       setError(error.message);
//     } finally {
//       setIsLoading(false); // Yuklash tugadi (xato bo'lsa ham)
//     }
//   };

//   // 1. Yuklanayotgan paytda ko'rinadigan qism
//   if (isLoading) {
//     return (
//       <div className={`min-h-125 w-full ${styles.flexCenter}`}>
//         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   // 2. Xatolik yuz berganda ko'rinadigan qism
//   if (error) {
//     return (
//       <div className={`min-h-125 w-full ${styles.flexCenter} text-white`}>
//         <p>Xatolik: {error}. Iltimos, serverni tekshiring.</p>
//       </div>
//     );
//   }

//   // 3. Ma'lumot muvaffaqiyatli kelganda
//   const profile = data[0]; // Qisqaroq yozish uchun

//   return (
//     <div
//       className={`flex justify-between flex-col px-10 py-12 rounded-[20px] max-w-92.5 md:mr-10 sm:mr-5 mr-0 my-5 cursor-pointer feedback-card`}
//     >
//       <img
//         src={data[0]?.work_image}
//         alt="quotes"
//         className={`w-full h-full object-contain`}
//       />{" "}
//       {/* w-10.5 h-6.75 */}
//       <p
//         className={`font-sans-serif font-normal text-[18px] leading-8 text-white my-10`}
//       >
//         {content}
//       </p>
//       <div className="flex flex-row">
//         <div
//           className={`w-12.5 h-12.5 flex justify-center items-center bg-slate-400 rounded-full bg-dark-gradient`}
//         >
//           <p className="text-gradient text-[22px] font-semibold font-sans-serif">
//             {name
//               .split(" ")
//               .map((c) => c[0])
//               .join(".")
//               .toUpperCase()}
//           </p>
//         </div>
//         <div className="flex flex-col ml-4">
//           <h4
//             className={`font-sans-serif font-semibold text-[20px] leading-8 text-white`}
//           >
//             {name}
//           </h4>
//           <p
//             className={`font-sans-serif font-normal text-[16px] leading-6 text-lightWhite`}
//           >
//             {title}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default FeedbackCard;

// -----------------------------------------------------------------------

// import { styles } from "../Util/style";

// function FeedbackCard({ work_image, work_content, work_title, work_stack }) {
//   return (
//     <div className={`flex justify-between flex-col px-10 py-12 rounded-[20px] max-w-92.5 md:mr-10 sm:mr-5 mr-0 my-5 cursor-pointer feedback-card transition-all duration-300 hover:bg-slate-800`}>
      
//       {/* Loyiha rasmi */}
//       <div className="w-full h-45 mb-5">
//         <img
//           src={work_image}
//           alt={work_title}
//           className="w-full h-full object-cover rounded-lg"
//         />
//       </div>

//       {/* Loyiha haqida qisqacha */}
//       <p className="font-poppins font-normal text-[18px] leading-8 text-white my-5 italic">
//         "{work_content}"
//       </p>

//       <div className="flex flex-row items-center mt-5">
//         {/* Logotip yoki Title birinchi harflari */}
//         <div className="w-12.5 h-12.5 flex justify-center items-center rounded-full bg-blue-gradient p-0.5">
//           <div className="flex justify-center items-center w-full h-full bg-primary rounded-full">
//              <p className="text-gradient text-[20px] font-bold">
//                {work_title.charAt(0).toUpperCase()}
//              </p>
//           </div>
//         </div>

//         <div className="flex flex-col ml-4">
//           <h4 className="font-poppins font-semibold text-[20px] leading-8 text-white uppercase tracking-wider">
//             {work_title}
//           </h4>
//           <p className="font-poppins font-normal text-[16px] leading-6 text-white">
//             {work_stack}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default FeedbackCard;

// -----------------------------------------------------------------------
import { Github } from "lucide-react"; // Ikonka uchun

function FeedbackCard({ work_image, work_content, work_title, work_stack, github_link }) {
  
  const handleCardClick = () => {
    if (github_link) {
      window.open(github_link, "_blank", "noopener,noreferrer");
    } else {
      console.log("GitHub link topilmadi");
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`flex justify-between flex-col px-10 py-12 rounded-[20px] max-w-92.5 md:mr-10 sm:mr-5 mr-0 my-5 cursor-pointer feedback-card transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] group`}
    >
      
      {/* Loyiha rasmi - Hover effekti bilan */}
      <div className="w-full h-45 mb-5 relative overflow-hidden rounded-lg">
        <img
          src={work_image}
          alt={work_title}
          className="w-full h-full object-cover"
        />
        {/* Hoverda chiqadigan qatlam */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Github color="white" size={32} />
        </div>
      </div>

      {/* Loyiha haqida qisqacha */}
      <p className="font-poppins font-normal text-[18px] leading-8 text-white my-5 italic">
        "{work_content}"
      </p>

      <div className="flex flex-row items-center mt-5">
        {/* Logotip qismi */}
        <div className="w-12.5 h-12.5 flex justify-center items-center rounded-full bg-blue-gradient p-0.5">
          <div className="flex justify-center items-center w-full h-full bg-primary rounded-full">
             <p className="text-gradient text-[20px] font-bold">
               {work_title ? work_title.charAt(0).toUpperCase() : "P"}
             </p>
          </div>
        </div>

        <div className="flex flex-col ml-4">
          <h4 className="font-poppins font-semibold text-[20px] leading-8 text-white uppercase tracking-wider">
            {work_title}
          </h4>
          <p className="font-poppins font-normal text-[16px] leading-6 text-white">
            {work_stack}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeedbackCard;