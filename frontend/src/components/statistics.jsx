import { useState } from "react";
import { styles } from "../Util/style"
import { useEffect } from "react";

function Statistics() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
  const [error, setError] = useState(null);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("https://portfolio-del-backend.onrender.com/api/v1/get_all_statistiks", {
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

  if (isLoading) {
    return (
      <div className={`min-h-[20vh] w-full ${styles.flexCenter}`}>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,246,255,0.5)]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[20vh] w-full ${styles.flexCenter} text-white`}>
        <div className="glassmorphism p-6 rounded-2xl border-red-500/30">
          <p className="text-red-400 font-poppins">Xatolik: {error}</p>
        </div>
      </div>
    );
  }

  const profile = data[0]; 

  return (
    <div className={`flex flex-row flex-wrap justify-center items-center sm:mb-20 mb-6 gap-6 w-full relative z-10`}>
      {data.map(stat => (
        <div key={stat?._id} className={`flex-1 min-w-[250px] flex justify-center items-center flex-row p-6 rounded-2xl glassmorphism transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,246,255,0.15)] hover:border-cyan-500/40 group relative overflow-hidden`}>
          {/* Orqa fon yorug'ligi */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-cyan-400/20"></div>
          
          {/* Raqam qismi */}
          <h4 className={`font-poppins font-bold text-[35px] sm:text-[45px] text-white drop-shadow-[0_0_10px_rgba(0,246,255,0.5)] group-hover:text-cyan-300 transition-colors duration-300 relative z-10`}>
            {stat?.value}
          </h4>
          
          {/* O'rtadagi chiziq */}
          <div className="w-1 h-12 bg-gradient-to-b from-cyan-400 to-blue-500 mx-5 rounded-full shadow-[0_0_10px_rgba(0,246,255,0.5)] opacity-70 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
          
          {/* Matn qismi */}
          <p className={`font-poppins font-medium text-[16px] sm:text-[20px] text-gradient uppercase tracking-wider relative z-10 leading-snug`}>
            {stat?.title}
          </p>
        </div>
      ))}
    </div>
  )
}

export default Statistics
