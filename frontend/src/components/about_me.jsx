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
//       const response = await fetch("http://localhost:4039/get_all_about_me", {
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
  const [isLoading, setIsLoading] = useState(true); // Yuklanish holati
  const [error, setError] = useState(null);
  const [cvLoading, setCVLoading] = useState([]);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4039/get_all_about_me", {
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
  const handleDownloadCV = async () => {
    try {
      setCVLoading(true);
      const responsee = await fetch(
        "http://localhost:4039/get_all_CVandSertificat",
      );

      if (!responsee.ok) throw new Error("Ma'lumot olishda xatolik");

      const dates = await responsee.json();

      if (Array.isArray(dates) && dates.length > 0) {
        // Bazadan kelgan linkni olamiz
        const rawUrl = dates[0]?.cv_url;

        if (rawUrl === "") {
          return toast("CV hali yuklanmagan");
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
    <section
      id="home"
      className={`flex md:flex-row flex-col ${styles.paddingY}`}
    >
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
      {/* Rasm qismi */}

      <div className={`flex-1 ${styles.flexCenter} md:my-0 my-10 relative`}>
        <img
          src={profile?.about_me_image}
          alt="me"
          className="w-75 h-75 ss:w-112.5 ss:h-112.5 object-cover rounded-full relative z-10 border-4 border-blue-500 shadow-2xl"
        />
        {/* Gradientlar */}
        <div className="absolute z-0 w-[40%] h-[35%] top-0 pink__gradient" />
        <div className="absolute z-1 w-[80%] h-[80%] rounded-full bottom-40 white__gradient" />
        <div className="absolute z-0 w-[50%] h-[50%] right-20 bottom-20 blue__gradient" />
      </div>

      {/* Ma'lumotlar qismi */}
      <div
        className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-6`}
      >
        <div className="w-full">
          <h1 className={`${styles.heading1}`}>
            {profile?.salom} <br className="sm:block hidden" />
            <span className="text-gradient">{profile?.fullName}</span>
          </h1>
          <h2 className="text-white font-semibold text-[32px] mt-2">
            {profile?.work_title}
          </h2>
        </div>

        <p className={`${styles.paragraph} mt-5 max-w-117.5`}>
          {profile?.work_description}
        </p>

        {/* Tugmaga onclick funksiyasini biriktiramiz */}
        <div onClick={handleDownloadCV}>
          <Button stayles="mt-10" title="CV yuklab olish" />
        </div>
        {/* <Button stayles="mt-10" /> */}
      </div>
    </section>
  );
}

export default About_me;
