// import { features } from "../Util/constants";
// import { styles } from "../Util/style";
// import {
//   Linkedin,
//   Youtube,
//   Send,
//   Twitter,
//   Instagram,
//   Facebook,
//   Github, // Dasturchilar uchun muhim!
//   Globe, // Shaxsiy veb-sayt uchun
//   Phone, // Telefon uchun
//   Mail, // Email uchun
// } from "lucide-react";

// const iconMap = {
//   Linkedin: Linkedin,
//   Youtube: Youtube,
//   Send: Send, // Telegram uchun
//   Twitter: Twitter,
//   Instagram: Instagram,
//   Facebook: Facebook,
//   Github: Github,
//   Globe: Globe,
//   Phone, // Telefon uchun
//   Mail, // Email uchun
// };

// function FeatureCard({ icon, title, context, url, idx }) {
//   const IconComponent = iconMap[icon] || Send;

//   return (
//     <a href={`${url}`} target="blank">
//       <div
//         className={`flex flex-row p-6 rounded-[20px] cursor-pointer feature-card ${idx !== features.length - 1 ? "mb-6" : "mb-0"}`}
//       >
//         <div
//           className={`w-16 h-16 rounded-full ${styles.flexCenter} bg-lightBlue`}
//         >
//           {/* 3. Dinamik ikonkani shu yerda ishlatamiz */}
//           <IconComponent
//             size={32}
//             color="white" /*className={`bg-blue-gradient`}*/
//           />
//           {/* <img src={icon} alt={title} className={`w-[50%] h-[50%] object-contain`} /> */}
//         </div>

//         <div className={`flex-1 flex flex-col ml-3`}>
//           <h4
//             className={`font-sans-serif font-semibold text-white text-[18px] leading-5.75 mb-1`}
//           >
//             {title}
//           </h4>
//           <p
//             className={`font-sans-serif font-normal text-lightWhite text-[16px] leading-6`}
//           >
//             {context}
//           </p>
//         </div>
//       </div>
//     </a>
//   );
// }

// export default FeatureCard;

// -----------------------------------------------------------

import React from "react";
import { 
  Linkedin, Youtube, Send, Twitter, Instagram, 
  Facebook, Github, Globe, Phone, Mail 
} from "lucide-react";
import { features } from "../Util/constants";
import { styles } from "../Util/style";

// Ikonkalar xaritasi - komponent tashqarisida bo'lgani yaxshi
const iconMap = {
  Linkedin,
  Youtube,
  Send,      // Telegram uchun ko'p ishlatiladi
  Twitter,
  Instagram,
  Facebook,
  Github,
  Globe,
  Phone,
  Mail,
};

/**
 * FeatureCard Komponenti
 * @param {string} icon - iconMap dagi kalit so'z
 * @param {string} title - Karta sarlavhasi
 * @param {string} context - Karta matni
 * @param {string} url - Havola manzili
 * @param {number} idx - Massivdagi tartib raqami
 */
const FeatureCard = ({ icon, title, context, url, idx }) => {
  // Agar icon topilmasa, standart holatda 'Send' (Telegram) ikonkasini chiqaramiz
  const IconComponent = iconMap[icon] || Send;

  // Oxirgi element bo'lmasa pastki marjin qo'shish
  const isLast = idx === features.length - 1;
  const url_path = url === "" ? "https://t.me/Malenkiy_master" : url

  return (
    <a 
      href={url_path} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block no-underline"
    >
      <div
        className={`flex flex-row p-6 rounded-[20px] cursor-pointer feature-card transition-all duration-300 hover:bg-slate-800 ${
          isLast ? "mb-0" : "mb-6"
        }`}
      >
        {/* Ikonka konteyneri */}
        <div className={`w-16 h-16 rounded-full ${styles.flexCenter} bg-lightBlue shrink-0`}>
          <IconComponent
            size={32}
            color="white"
          />
        </div>

        {/* Matn qismi */}
        <div className="flex-1 flex flex-col ml-4">
          <h4 className="font-poppins font-semibold text-white text-[18px] leading-5.75 mb-1">
            {title}
          </h4>
          <p className="font-poppins font-normal text-white text-[16px] leading-6">
            {context}
          </p>
        </div>
      </div>
    </a>
  );
};

export default FeatureCard;