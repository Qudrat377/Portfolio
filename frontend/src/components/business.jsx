import { useEffect, useState } from "react";
import { features } from "../Util/constants"
import { layout, styles } from "../Util/style"
import Button from "./button"
import FeatureCard from "./feature-card"

function Business() {
  const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
  
    // 1. Funksiyalarni useEffect dan tepada e'lon qilamiz
    const getData = async () => {
      try {
        const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_SetMe", {
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
        const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_sets");
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

  return (
    <section id="features" className={`flex flex-col items-center justify-center relative min-h-[60vh] py-20`}>
      {/* Orqa fon nur effektlari */}
      <div className="absolute z-0 w-[40%] h-[40%] left-0 top-20 pink__gradient opacity-20 pointer-events-none" />
      <div className="absolute z-0 w-[40%] h-[40%] right-0 bottom-20 blue__gradient opacity-30 pointer-events-none" />

      {/* Sarlavha qismi (Markazda) */}
      <div className={`flex flex-col items-center text-center z-10 mb-16 w-full max-w-[800px]`}>
        <h2 className={`${styles.heading2} font-bold tracking-wide`}>
          <span className="text-gradient drop-shadow-[0_0_10px_rgba(0,246,255,0.5)]">
            {data[0]?.set_me_title_first || "Men Bilan"} 
          </span>
          {" "}
          {data[0]?.set_me_title_second || "Bog'lanish"}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mt-4 mb-6 shadow-[0_0_10px_rgba(0,246,255,0.8)]"></div>
        <p className={`${styles.paragraph} text-gray-300 leading-relaxed text-lg`}>
          {data[0]?.set_me_description || "Loyihalar, takliflar yoki shunchaki suhbatlashish uchun men bilan quyidagi tarmoqlar orqali bog'lanishingiz mumkin. Ochiq suhbatga doim tayyorman!"}
        </p>
      </div>
      
      {/* Ikonkalar gridi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 z-10 w-full justify-items-center">
        {projects.map((features, idx) => (
          <FeatureCard key={features._id} {...features} idx={idx}/>
        ))}
      </div>
    </section>
  )
}

export default Business
