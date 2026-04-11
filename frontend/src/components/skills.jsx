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
    <div className={`flex flex-col p-6 rounded-[20px] feature-card min-w-62.5 transition-all duration-500 hover:scale-105 bg-black-gradient`}>
      <div className={`w-12 h-12 rounded-full ${styles.flexCenter} bg-dimBlue mb-4`}>
        <IconComponent size={24} className="text-secondary" />
      </div>
      
      <h4 className="font-poppins font-semibold text-white text-[25px] mb-3">
        {title_skill}
      </h4>

      <div className="flex flex-wrap gap-2">
        {skill_items.map((item, index) => (
          <span
            key={index}
            className="bg-blue-gradient text-primary text-[18px] px-3 py-1 rounded-full font-medium shadow-sm"
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
        const skillsRes = await fetch("https://portfolio-del-backend.onrender.com/get_all_skills");
        const skillsInfo = await skillsRes.json();

        // 2. Sarlavhalarni olish (Agar bu boshqa endpoint bo'lsa)
        const headerRes = await fetch("https://portfolio-del-backend.onrender.com/get_skills_title");
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
    <div className="w-full py-20 flex justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return <div className="text-white text-center py-10">Xato: {error}</div>;

  return (
    <section id="skills" className={`${layout.section} flex-col`}>
      {/* Sarlavha qismi */}
      <div className={layout.sectionInfo}>
        <h2 className={styles.heading2}>
          {headerData?.title_skill_header || "My"} {" "}
          <span className="text-gradient">{headerData?.title_skill_color || "Skills"}</span>
        </h2>
        <p className={`${styles.paragraph} max-w-150 mt-5 mb-10`}>
          {headerData?.skill_description || "Professional skills and technologies I use."}
        </p>
      </div>

      {/* Kartochkalar qismi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {skillsData.map((skill) => (
          <SkillCard 
            key={skill._id} 
            title_skill={skill.title_skill}
            skill_items={skill.skill_items}
            icon={skill.icon}
          />
        ))}
      </div>
    </section>
  );
}

export default Skills;
