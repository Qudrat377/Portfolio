// import { useEffect, useState } from "react";
// import { feedbacks } from "../Util/constants"
// import { styles } from "../Util/style"
// import FeedbackCard from "./feedback-card"

// function Works() {
//   const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
//   const [error, setError] = useState(null);
//   const [projects, setProjects] = useState([]);

//   const getData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("http://localhost:4039/get_all_works", {
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

//   // proyektlarni ko'rsatish uchun 

  
//     const fetchProjects = async () => {
//       try {
//         setIsLoading(true);
//         const response = await fetch("http://localhost:4039/get_all_WorkProjects");
//         if (!response.ok) throw new Error("Loyihalarni yuklashda xatolik");
        
//         const dates = await response.json();
//         setProjects(Array.isArray(dates) ? dates : []);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     };  

//       useEffect(() => {
//     getData();
//     fetchProjects();
//   }, []);

//   return (
//     <div id="portfolio" className={`${styles.paddingY} ${styles.flexCenter} flex-col relative`}>
//         <div className={`absolute z-0 w-[60%] h-[60%] -right-[50%] rounded-full blue__gradient bottom-40`}/>

//             <div className={`w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-1`}>
//                 <h2 className={`${styles.heading2}`}>{data[0]?.work_header_title}</h2>
//                 <div className={`w-full md:mt-0 mt-6`}>
//                     <p className={`${styles.paragraph} text-left max-w-137.5`}>
//                         {data[0]?.work_value}
//                     </p>
//                 </div>
//             </div>
//             <div className="flex flex-wrap sm:justify-start justify-center w-full feedback-container relative z-1">
//         {projects.map((project) => (
//           <FeedbackCard key={project._id} {...project} />
//         ))}
//       </div>
//             {/* <div className={`flex flex-wrap sm:justify-start justify-center w-full relative z-1`}>
//                 {projects.map((feedback, idx) => (
//                    <FeedbackCard key={feedback._id} {...feedback} idx={idx} /> 
//                 ))}
//             </div> */}
//     </div>
//   )
// }

// export default Works

// --------------------------------------------------------------------

import { useEffect, useState } from "react";
import { styles } from "../Util/style";
import FeedbackCard from "./feedback-card";

function Works() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getData = async () => {
    try {
      const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_works", {
        method: "GET",
        headers: { "Content-type": "application/json" },
      });
      if (!response.ok) throw new Error("Sarlavha olishda xatolik");
      const info = await response.json();
      setData(Array.isArray(info) ? info : []);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_WorkProjects");
      if (!response.ok) throw new Error("Loyihalarni yuklashda xatolik");
      const dates = await response.json();
      setProjects(Array.isArray(dates) ? dates : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([getData(), fetchProjects()]);
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-[50vh] w-full ${styles.flexCenter}`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,246,255,0.5)]"></div>
          <p className="text-cyan-400 mt-4 font-poppins animate-pulse">Loyihalar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[50vh] w-full ${styles.flexCenter} text-white`}>
        <div className="glassmorphism p-8 rounded-2xl border-red-500/30">
          <p className="text-red-400 font-poppins">Xatolik: {error}. Iltimos, serverni tekshiring.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="portfolio" className={`${styles.paddingY} ${styles.flexCenter} flex-col relative min-h-[80vh]`}>
      <div className={`absolute z-0 w-[60%] h-[60%] -right-[50%] rounded-full blue__gradient bottom-40 opacity-60`} />

      <div className={`w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-10`}>
        <h2 className={`${styles.heading2} flex items-center gap-4`}>
          <span className="w-2 h-10 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,246,255,0.8)] hidden md:block"></span>
          {data[0]?.work_header_title || "Mening ishlarim"}
        </h2>
        <div className={`w-full md:mt-0 mt-6`}>
          <p className={`${styles.paragraph} text-left max-w-[600px] text-gray-300`}>
            {data[0]?.work_value || "Men yaratgan amaliy loyihalar va ishlarning namunasi."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full relative z-10 justify-items-center">
        {projects.map((project) => (
          <FeedbackCard key={project._id} {...project} />
        ))}
      </div>
    </div>
  );
}

export default Works;
