import { useState } from "react";
import { card } from "../assets";
import { layout, styles } from "../Util/style";
import Sertificat_btn from "./sertifiqat_button";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";

function Learn() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
  const [error, setError] = useState(null);
  const [cvLoading, setCVLoading] = useState([]);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_learn", {
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
      setIsLoading(false); // Yuklash tugadi (xato bo'lsa ham)
    }
  };

  // Button bosilganda ishlaydigan funksiya
  const handleDownloadSertificat = async () => {
    try {
      setCVLoading(true);
      const responsee = await fetch(
        "https://portfolio-del-backend.onrender.com/get_all_CVandSertificat",
      );

      if (!responsee.ok) throw new Error("Ma'lumot olishda xatolik");

      const dates = await responsee.json();

      if (Array.isArray(dates) && dates.length > 0) {
        // Bazadan kelgan linkni olamiz
        const rawUrl = dates[0]?.sertificat_url;

        if (rawUrl === "") {
            return toast("Kursni bitirmadim hali")
        }

        if (rawUrl) {
          // 1. Linkni yuklab olish formatiga keltiramiz (Google Drive bo'lsa)
          const downloadUrl = rawUrl.replace(
            "/view?usp=sharing",
            "/uc?export=download",
          );

          // 2. Ko'rinmas 'a' tegi yaratamiz
          const link = document.createElement("a");
          link.href = downloadUrl;

          // 3. Fayl nomini belgilaymiz
          link.setAttribute("download", "Qudrat_Razzoqov_CV.pdf");

          // 4. Tegni dokumentga qo'shib, uni avtomatik bosamiz
          document.body.appendChild(link);
          link.click();

          // 5. Tegni o'chirib tashlaymiz
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Xato:", error.message);
    } finally {
      setCVLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-[50vh] w-full ${styles.flexCenter}`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,246,255,0.5)]"></div>
          <p className="text-cyan-400 mt-4 font-poppins animate-pulse">Yuklanmoqda...</p>
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

  const profile = data[0];

  return (
    <section id="learn" className={`${layout.section} relative min-h-[80vh]`}>
      <ToastContainer
          position="top-right"
          autoClose={4000}
          theme="dark"
          toastClassName="glassmorphism !bg-[#00040f]/90 !text-white !border !border-cyan-500/30"
        />
      <div className={`${layout.sectionInfo} z-10`}>
        <h2 className={`${styles.heading2} font-bold tracking-wide flex items-center gap-4`}>
          <span className="w-2 h-10 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,246,255,0.8)] hidden md:block"></span>
          {data[0]?.title_learn || "Ta'lim"}
        </h2>
        <p className={`${styles.paragraph} max-w-[500px] mt-5 text-gray-300 leading-relaxed text-lg`}>
          {data[0]?.description_learn || "O'qigan joylarim haqida qisqacha ma'lumot."}
        </p>
        <div 
          onClick={cvLoading ? null : handleDownloadSertificat} 
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
            ) : "Sertifikatni ko'rish"}
          </button>
        </div>
      </div>
      <div className={`${layout.sectionImage} relative z-10`}>
        <div className="absolute z-0 w-[50%] h-[50%] -left-1/2 top-0 pink__gradient opacity-40" />
        <div className="absolute z-0 w-[40%] h-[40%] right-0 bottom-0 blue__gradient opacity-50" />
        <img 
          src={data[0]?.image_url || card} 
          alt="card" 
          className={`w-[90%] h-[90%] object-contain relative z-10 animate-float drop-shadow-[0_0_30px_rgba(0,246,255,0.4)] rounded-2xl`} 
        />
      </div>
    </section>
  );
}

export default Learn;
