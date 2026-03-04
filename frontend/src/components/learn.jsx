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
      const response = await fetch("http://localhost:4039/get_all_learn", {
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
        "http://localhost:4039/get_all_CVandSertificat",
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

  return (
    <section id="learn" className={layout.section}>
      <ToastContainer
          position="top-left"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      <div className={layout.sectionInfo}>
        <h2 className={styles.heading2}>
          {data[0]?.title_learn}
          <br />{" "}
        </h2>
        <p className={`${styles.paragraph} max-w-137.5 mt-5`}>
          {data[0]?.description_learn}
        </p>
        {/* Tugmaga onclick funksiyasini biriktiramiz */}
        <div onClick={handleDownloadSertificat}>
          <Sertificat_btn stayles="mt-10" title="CV yuklab olish" />
        </div>
        {/* <Sertificat_btn stayles={`mt-10 mb-5`} /> */}
      </div>
      <div className={layout.sectionImage}>
        <img src={data[0]?.image_url} alt="card" className={`w-full h-full`} />
      </div>
    </section>
  );
}

export default Learn;
