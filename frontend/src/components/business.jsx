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
        const response = await fetch("http://localhost:4039/get_all_SetMe", {
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
        const response = await fetch("http://localhost:4039/get_all_sets");
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
  
  return (
    <section id="features" className={layout.section}>
      <div className={layout.sectionInfo}>
        <h2 className={`${styles.heading2} text-gradient`}>
          {data[0]?.set_me_title_first} <br /> <br className={`sm:block hidden`} />{data[0]?.set_me_title_second}
        </h2>
        <p className={`${styles.paragraph} max-w-137.5 mt-5`}>
          {data[0]?.set_me_description}
        </p>
        {/* <Button stayles={`mt-10`}/> */}
      </div>
      <div className={`${layout.sectionImage} flex-col`}>
        {projects.map((features, idx) => (
          <FeatureCard key={features._id} {...features} idx={idx}/>
        ))}
      </div>
    </section>
  )
}

export default Business
