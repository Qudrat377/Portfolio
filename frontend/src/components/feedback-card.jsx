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
import { Github } from "lucide-react";

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
      className={`flex justify-between flex-col p-6 rounded-2xl w-full max-w-[380px] my-5 cursor-pointer glassmorphism transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,246,255,0.15)] hover:border-cyan-500/40 group`}
    >
      
      {/* Loyiha rasmi - Hover effekti bilan */}
      <div className="w-full h-48 mb-5 relative overflow-hidden rounded-xl border border-white/5">
        <img
          src={work_image || "https://via.placeholder.com/400x300"}
          alt={work_title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Hoverda chiqadigan qatlam */}
        <div className="absolute inset-0 bg-[#00040f]/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-cyan-500/20 p-4 rounded-full border border-cyan-400/50 mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Github color="#00f6ff" size={32} />
          </div>
          <span className="text-cyan-400 font-poppins font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            Loyihani ko'rish
          </span>
        </div>
      </div>

      {/* Loyiha haqida qisqacha */}
      <p className="font-poppins font-normal text-[16px] leading-7 text-gray-300 mb-6 flex-grow line-clamp-3">
        {work_content}
      </p>

      <div className="flex flex-row items-center mt-auto border-t border-white/10 pt-4">
        {/* Logotip qismi */}
        <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 p-[2px] shadow-[0_0_10px_rgba(0,246,255,0.3)]">
          <div className="flex justify-center items-center w-full h-full bg-[#00040f] rounded-full">
             <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-[20px] font-bold">
               {work_title ? work_title.charAt(0).toUpperCase() : "P"}
             </p>
          </div>
        </div>

        <div className="flex flex-col ml-4 overflow-hidden">
          <h4 className="font-poppins font-semibold text-[18px] leading-6 text-white uppercase tracking-wider truncate">
            {work_title || "Loyiha Nomi"}
          </h4>
          <p className="font-poppins font-normal text-[14px] leading-5 text-cyan-400 mt-1 truncate">
            {work_stack || "Texnologiyalar"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeedbackCard;