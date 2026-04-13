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

  // 1. Funksiyalarni useEffect dan tepada e'lon qilamiz
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
      const response = await fetch("https://portfolio-del-backend.onrender.com/get_all_WorkProjects");
      if (!response.ok) throw new Error("Loyihalarni yuklashda xatolik");
      const dates = await response.json();
      setProjects(Array.isArray(dates) ? dates : []);
    } catch (err) {
      setError(err.message);
    }
  };

  // 2. Barcha ma'lumotlarni bir vaqtda olish uchun useEffect
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([getData(), fetchProjects()]);
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  // 3. SHARTLI RETURNLAR (Barcha funksiyalar va Hooklardan keyin bo'lishi shart!)
  if (isLoading) {
    return (
      <div className={`min-h-100 w-full ${styles.flexCenter}`}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-100 w-full ${styles.flexCenter} text-white`}>
        <p>Xatolik: {error}. Iltimos, serverni tekshiring.</p>
      </div>
    );
  }

  // 4. ASOSIY RENDER
  return (
    <div id="portfolio" className={`${styles.paddingY} ${styles.flexCenter} flex-col relative`}>
      <div className={`absolute z-0 w-[60%] h-[60%] -right-[50%] rounded-full blue__gradient bottom-40`} />

      <div className={`w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-1`}>
        <h2 className={`${styles.heading2}`}>
          {data[0]?.work_header_title || "Mening ishlarim"}
        </h2>
        <div className={`w-full md:mt-0 mt-6`}>
          <p className={`${styles.paragraph} text-left max-w-137.5`}>
            {data[0]?.work_value}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap sm:justify-start justify-center w-full feedback-container relative z-1">
        {projects.map((project) => (
          <FeedbackCard key={project._id} {...project} />
        ))}
      </div>
    </div>
  );
}

export default Works;
