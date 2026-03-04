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
        const response = await fetch("https://portfolio-del-backend.onrender.com/get_all_statistiks", {
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
  
    // 1. Yuklanayotgan paytda ko'rinadigan qism
    if (isLoading) {
      return (
        <div className={`min-h-125 w-full ${styles.flexCenter}`}>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
  
    // 2. Xatolik yuz berganda ko'rinadigan qism
    if (error) {
      return (
        <div className={`min-h-125 w-full ${styles.flexCenter} text-white`}>
          <p>Xatolik: {error}. Iltimos, serverni tekshiring.</p>
        </div>
      );
    }
  
    // 3. Ma'lumot muvaffaqiyatli kelganda
    const profile = data[0]; // Qisqaroq yozish uchun
    console.log(data);
    
  
  return (
    <div className={`${styles.flexStart} flex-row flex-wrap sm:mb-20 mb-6`}>
      {data.map(stat => (
        <div key={stat?._id} className={`flex-1 flex justify-start items-center flex-row m-3`}>
          <h4 className={`font-sans-serif font-semibold xs:text-[41px] text-[30px] xs:leading-13.25 leading-10.75 text-white`}>
            {stat?.value}
          </h4>
          <p className={`font-sans-serif font-normal xs:text-[20px] text-[16px] xs:leading-6.5 leading-5.5 text-gradient uppercase ml-3`}>{stat?.title}</p>
        </div>
      ))}
    </div>
  )
}

export default Statistics
