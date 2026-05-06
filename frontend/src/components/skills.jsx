import { useState } from "react";
import { layout, styles } from "../Util/style";
import { 
  Code2, 
  Server, 
  Database, 
  Cpu, 
  Layout, 
  Smartphone, 
  Globe, 
  Layers, 
  Terminal,
  ShieldCheck,
  Palette
} from "lucide-react";
import { useEffect } from "react";

// const skillIconMap = {
//   Server: Server,
//   Database: Database,
//   Cpu: Cpu,
//   Code2: Code2,
// };

// const SkillCard = ({ title, items, icon, idx }) => {
//   const IconComponent = skillIconMap[icon];
//     const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     getData();
//   }, []);

//   const getData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("http://localhost:4039/get_all_skills", {
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
//       className={`flex flex-col p-6 rounded-[20px] feature-card min-w-62.5 transition-all duration-500 hover:scale-105`}
//     >
//       <div
//         className={`w-12 h-12 rounded-full ${styles.flexCenter} bg-lightBlue mb-4`}
//       >
//         <IconComponent size={24} color="white" />
//       </div>
//       <h4 className="font-sans-serif font-semibold text-white text-[20px] mb-3">
//         {data?.title_skill}
//       </h4>
//       <div className="flex flex-wrap gap-2">
//         {data.map((item) => (
//           <span
//             key={item._id}
//             className="bg-blue-gradient text-black text-[18px] px-3 py-1 rounded-full font-medium shadow-sm"
//           >
//             {item.skill_items}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// };

// function Skills() {
//   const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     getData();
//   }, []);

//   const getData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("http://localhost:4039/get_skills_title", {
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
//     <section id="skills" className={`${layout.section} flex-col`}>
//       <div className={layout.sectionInfo}>
//         <h2 className={styles.heading2}>
//           {data[0]?.title_skill_header}{" "}
//           <span className="text-gradient">{data[0]?.title_skill_color}</span>
//         </h2>
//         <p className={`${styles.paragraph} max-w-150 mt-5 mb-10`}>
//           {data[0]?.skill_description}
//         </p>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
//         {skills.map((skill, idx) => (
//           <SkillCard key={skill.id} {...skill} idx={idx} />
//         ))}
//       </div>
//     </section>
//   );
// }

// export default Skills;

const skillIconMap = {
  // Mavjudlari
  Server: Server,     // Backend uchun
  Database: Database, // Ma'lumotlar bazasi uchun
  Cpu: Cpu,           // Tools yoki Hardware
  Code2: Code2,       // Languages / Coding
  Frontend: Layout,      // Frontend (Sayt strukturasi)
  Mobile: Smartphone,    // Mobile App (Telefon ko'rinishi)
  Web: Globe,            // Web texnologiyalar
  FullStack: Layers,     // Arxiv yoki qatlamlar (Hamma qism)
  DevOps: Terminal,      // Konsol yoki avtomatlashtirish
  Security: ShieldCheck, // Xavfsizlik
  Design: Palette,       // UI/UX yoki Dizayn
};

const SkillCard = ({ title_skill, skill_items, icon }) => {
  // Agar icon bazada noto'g'ri bo'lsa, Code2 ni default qilamiz
  const IconComponent = skillIconMap[icon] || Code2;

  return (
    <div className={`flex flex-col items-center p-8 rounded-[30px] glassmorphism transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_15px_40px_rgba(0,246,255,0.2)] hover:bg-cyan-900/10 hover:border-cyan-500/50 group relative overflow-hidden h-full border border-white/5 w-full`}>
      {/* Karta orqasidagi nur */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 group-hover:scale-150 group-hover:bg-cyan-400/20"></div>
      
      {/* Ikonka */}
      <div className={`w-20 h-20 rounded-[24px] flex justify-center items-center bg-gradient-to-br from-[#00040f] to-[#00102a] border border-cyan-500/30 mb-6 shadow-[0_0_15px_rgba(0,246,255,0.1)] group-hover:shadow-[0_0_30px_rgba(0,246,255,0.5)] group-hover:border-cyan-400 transition-all duration-300 relative z-10`}>
        <IconComponent size={36} className="text-gray-400 group-hover:text-[#00f6ff] transition-colors duration-300" />
      </div>
      
      {/* Sarlavha */}
      <h4 className="font-poppins font-semibold text-white text-[22px] mb-5 text-center relative z-10 group-hover:text-cyan-400 transition-colors duration-300 tracking-wide">
        {title_skill}
      </h4>

      {/* Texnologiyalar ro'yxati markazlashgan holda */}
      <div className="flex flex-wrap justify-center gap-2.5 relative z-10 mt-auto">
        {skill_items.map((item, index) => (
          <span
            key={index}
            className="bg-[#00040f]/80 border border-cyan-500/20 text-gray-300 text-[14px] px-4 py-1.5 rounded-full font-medium shadow-sm transition-all duration-300 hover:border-cyan-400 hover:text-[#00f6ff] hover:bg-cyan-900/40 hover:shadow-[0_0_10px_rgba(0,246,255,0.3)] hover:-translate-y-0.5 cursor-default"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

function Skills() {
  const [skillsData, setSkillsData] = useState([]);
  const [headerData, setHeaderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        // 1. Skillarni olish
        const skillsRes = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_skills");
        const skillsInfo = await skillsRes.json();

        // 2. Sarlavhalarni olish
        const headerRes = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_skills_title");
        const headerInfo = await headerRes.json();

        setSkillsData(Array.isArray(skillsInfo) ? skillsInfo : []);
        setHeaderData(Array.isArray(headerInfo) ? headerInfo[0] : null);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (isLoading) return (
    <div className={`min-h-[50vh] w-full ${styles.flexCenter}`}>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,246,255,0.5)]"></div>
        <p className="text-cyan-400 mt-4 font-poppins animate-pulse">Ko'nikmalar yuklanmoqda...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-[50vh] w-full ${styles.flexCenter} text-white`}>
      <div className="glassmorphism p-8 rounded-2xl border-red-500/30">
        <p className="text-red-400 font-poppins">Xatolik: {error}. Iltimos, serverni tekshiring.</p>
      </div>
    </div>
  );

  return (
    <section id="skills" className={`flex flex-col items-center justify-center relative min-h-[80vh] py-20`}>
      {/* Sarlavha qismi - Markazlashgan xuddi Set Me kabi */}
      <div className={`flex flex-col items-center text-center z-10 mb-16 w-full max-w-[800px]`}>
        <h2 className={`${styles.heading2} font-bold tracking-wide flex justify-center items-center gap-3`}>
          {headerData?.title_skill_header || "Texnik"} {" "}
          <span className="text-gradient drop-shadow-[0_0_10px_rgba(0,246,255,0.5)]">{headerData?.title_skill_color || "Ko'nikmalar"}</span>
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mt-4 mb-6 shadow-[0_0_10px_rgba(0,246,255,0.8)]"></div>
        <p className={`${styles.paragraph} text-gray-300 leading-relaxed text-lg`}>
          {headerData?.skill_description || "Professional faoliyatim davomida o'rgangan va ishlatgan asosiy texnologiyalarim."}
        </p>
      </div>

      {/* Kartochkalar qismi - Flexbox bilan yoyiladigan qilingan */}
      <div className="flex flex-wrap justify-center items-stretch gap-6 w-full relative z-10">
        <div className="absolute z-0 w-[40%] h-[40%] -left-10 bottom-40 pink__gradient opacity-30 pointer-events-none" />
        <div className="absolute z-0 w-[40%] h-[40%] right-0 top-0 blue__gradient opacity-40 pointer-events-none" />
        
        {skillsData.map((skill) => (
          <div key={skill._id} className="flex-1 min-w-[250px] sm:basis-[calc(50%-1.5rem)] lg:basis-[calc(33.333%-1.5rem)] xl:basis-[calc(20%-1.5rem)] flex">
            <SkillCard 
              title_skill={skill.title_skill}
              skill_items={skill.skill_items}
              icon={skill.icon}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skills;
