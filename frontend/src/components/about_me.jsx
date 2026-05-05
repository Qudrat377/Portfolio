// import { useState } from "react";
// import { discount, robot } from "../assets";
// import { styles } from "../Util/style";
// import Button from "./button";
// import { useEffect } from "react";

// function Home() {
//   const [data, setData] = useState([]);
//   const [error, setError] = useState(null);
// console.log(data);

//   useEffect(() => {
//     getData();
//   }, []);

//   // get

//   const getData = async () => {
//     try {
//       const response = await fetch("https://portfolio-del-backend.onrender.com/get_all_about_me", {
//         method: "GET",
//         headers: {
//           // chekts: chekt,
//           "Content-type": "application/json",
//         },
//         credentials: "include",
//       });
//       if (!response.ok) {
//         throw new Error("Mallumot olishda xatolik");
//       }

//       const info = await response.json();

//       if (Array.isArray(info)) {
//         setData(info);
//       } else {
//         setData([]);
//       }
//     } catch (error) {
//       console.log(error.message);
//       setError("Malumot yuklashda xatolik");
//     }
//   };

//   return (
//     <section
//       id="home"
//       className={`flex md:flex-row flex-col ${styles.paddingY}`}
//     >
//       {/* animation img  */}
//       <div className={`flex-1 ${styles.flexStart} md:my-0 my-10`}>
//   <img
//     src={data[0]?.about_me_image}
//     // src="https://i.postimg.cc/bJ3X0NcJ/Snimok-ekrana-2025-10-15-210352.png"
//     alt="me"
//     /* w-64 h-64 — o'lchamni o'zingizga moslang, rounded-full — aylana qiladi #00f6ff */
//     className="w-114 h-114 object-cover rounded-full relative z-10 border-4 border-blue-500 shadow-xl"
//   />
// </div>

//       {/* information */}
//       <div
//         className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-6 relative`}
//       >
//         {/* Discount information  */}
//         {/* <div className="flex flex-row items-center py-1.5 px-4 rounded-[10px] mb-2 bg-slate-500 bg-discount-gradient">
//           <img src={discount} alt="discount" className={`w-8 h-8`} />
//           <p className={`${styles.paragraph} ml-2`}>
//             <span className="text-white"> 20% </span> Chegirma{" "}
//             <span className="text-white"> 1 oylik </span> hisob uchun
//           </p>
//         </div> */}

//         {/* Title  */}
//         <div className={`w-full`}></div>
//         <h1 className={`${styles.heading1}`}>
//          {data[0]?.salom} <br/> {data[0]?.fullName} <br /> <span className="text-gradient"> {data[0]?.work_title}</span>
//         </h1>

//         {/* description */}
//         <p className={`${styles.paragraph} mt-5 max-w-137.5`}>
//           {data[0]?.work_description}
//         </p>

//         {/* Grtting started  */}
//         <Button stayles={"mt-5"}/>

//         {/* Gradient background */}
//         <div className={`absolute z-0 w-[40%] h-[35%] top-0 pink__gradient`}/>
//         <div className={`absolute z-1 w-[80%] h-[80%] rounded-full bottom-40 white__gradient`}/>
//         <div className={`absolute z-0 w-[50%] h-[50%] right-20 bottom-20 blue__gradient`}/>
//       </div>
//     </section>
//   );
// }

// export default Home;

import { useState, useEffect } from "react";
import { styles } from "../Util/style";
import Button from "./button";
import { ToastContainer, toast } from "react-toastify";

function About_me() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cvLoading, setCVLoading] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_about_me", {
        method: "GET",
        headers: {
          "Content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Ma'lumot olishda xatolik yuz berdi");
      }

      const info = await response.json();

      if (Array.isArray(info) && info.length > 0) {
        setData(info);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Xato:", error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCV = async () => {
    try {
      setCVLoading(true);
      // FIXED THE URL TO INCLUDE /api/v1/
      const responsee = await fetch(
        "https://portfolio-del-backend.onrender.com/api/v1/get_all_CVandSertificat",
      );

      if (!responsee.ok) throw new Error("Ma'lumot olishda xatolik");

      const dates = await responsee.json();

      if (Array.isArray(dates) && dates.length > 0) {
        const rawUrl = dates[0]?.cv_url;

        if (!rawUrl || rawUrl === "") {
          return toast("CV hali yuklanmagan");
        }

        const downloadUrl = rawUrl.replace(
          "/view?usp=sharing",
          "/uc?export=download",
        );

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", "Qudrat_Razzoqov_CV.pdf");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast("CV topilmadi");
      }
    } catch (error) {
      console.error("Xato:", error.message);
      toast.error("Xatolik yuz berdi");
    } finally {
      setCVLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-[80vh] w-full ${styles.flexCenter}`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,246,255,0.5)]"></div>
          <p className="text-cyan-400 mt-4 font-poppins animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[80vh] w-full ${styles.flexCenter} text-white`}>
        <div className="glassmorphism p-8 rounded-2xl border-red-500/30">
          <p className="text-red-400 font-poppins">Xatolik: {error}. Iltimos, serverni tekshiring.</p>
        </div>
      </div>
    );
  }

  const profile = data[0];

  return (
    <section
      id="home"
      className={`flex md:flex-row flex-col-reverse ${styles.paddingY} relative items-center min-h-[90vh]`}
    >
      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme="dark"
        toastClassName="glassmorphism !bg-[#00040f]/90 !text-white !border !border-cyan-500/30"
      />

      {/* Ma'lumotlar qismi */}
      <div className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-6 z-10`}>
        <div className="w-full">
          <h1 className={`${styles.heading1} tracking-wide`}>
            {profile?.salom || "Salom,"} <br className="sm:block hidden" />
            <span className="text-gradient drop-shadow-[0_0_10px_rgba(0,246,255,0.5)] font-bold">
              {profile?.fullName || "Men Qudratman"}
            </span>
          </h1>
          <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-[24px] ss:text-[32px] mt-4 mb-2 animate-pulse-glow w-max px-4 py-1 rounded-lg border border-cyan-500/30 bg-cyan-900/20 shadow-[0_0_15px_rgba(0,246,255,0.2)]">
            {profile?.work_title || "Dasturchi"}
          </h2>
        </div>

        <p className={`${styles.paragraph} mt-5 max-w-[500px] text-gray-300 leading-relaxed text-lg`}>
          {profile?.work_description || "O'z ustimda ishlashni va yangi texnologiyalarni o'rganishni yoqtiraman."}
        </p>

        {/* Tugmaga onclick funksiyasini biriktiramiz */}
        <div 
          onClick={cvLoading ? null : handleDownloadCV}
          className={`mt-10 group relative inline-flex items-center justify-center cursor-pointer ${cvLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <div className="absolute transition-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt"></div>
          <button className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-[#00040f] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-[0_0_20px_rgba(0,246,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,246,255,0.6)]">
            {cvLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.415, 31.415" className="opacity-25"></circle>
                  <path d="M12 2C6.477 2 2 6.477 2 12h4c0-3.314 2.686-6 6-6V2z" fill="currentColor" className="opacity-75"></path>
                </svg>
                Yuklanmoqda...
              </span>
            ) : "CV Yuklab Olish"}
          </button>
        </div>
      </div>

      {/* Rasm qismi */}
      <div className={`flex-1 ${styles.flexCenter} md:my-0 my-16 relative z-10`}>
        <div className="relative w-64 h-64 ss:w-80 ss:h-80 md:w-96 md:h-96">
          {/* Aylanuvchi halqalar */}
          <div className="absolute inset-0 rounded-full border-[3px] border-cyan-500/30 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-full border-[3px] border-blue-500/30 border-t-cyan-400 animate-[spin_7s_linear_infinite_reverse]"></div>
          
          <img
            src={profile?.about_me_image || "https://via.placeholder.com/400"}
            alt="me"
            className="w-full h-full object-cover rounded-full relative z-10 border-4 border-cyan-400/50 shadow-[0_0_30px_rgba(0,246,255,0.4)] animate-float p-1 bg-[#00040f]"
          />
        </div>
        
        {/* Gradientlar */}
        <div className="absolute z-0 w-[50%] h-[50%] right-20 bottom-20 blue__gradient opacity-70 animate-pulse" />
        <div className="absolute z-0 w-[40%] h-[35%] top-0 pink__gradient opacity-50" />
      </div>
    </section>
  );
}

export default About_me;

