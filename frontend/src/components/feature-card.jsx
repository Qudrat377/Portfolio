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
      className="block no-underline group"
    >
      <div
        className={`flex flex-row items-center p-5 rounded-2xl cursor-pointer glassmorphism transition-all duration-300 hover:translate-x-2 hover:shadow-[0_0_20px_rgba(0,246,255,0.2)] hover:border-cyan-500/40 relative overflow-hidden ${
          isLast ? "mb-0" : "mb-4"
        }`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
        
        {/* Ikonka konteyneri */}
        <div className={`w-14 h-14 rounded-xl flex justify-center items-center bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 shrink-0 shadow-[0_0_10px_rgba(0,246,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,246,255,0.4)] transition-all duration-300 relative z-10`}>
          <IconComponent
            size={24}
            className="text-cyan-400 group-hover:text-white transition-colors duration-300"
          />
        </div>

        {/* Matn qismi */}
        <div className="flex-1 flex flex-col ml-5 relative z-10">
          <h4 className="font-poppins font-semibold text-white text-[18px] leading-6 mb-1 group-hover:text-cyan-400 transition-colors duration-300">
            {title}
          </h4>
          <p className="font-poppins font-normal text-gray-400 text-[14px] leading-5 line-clamp-2 group-hover:text-gray-200 transition-colors duration-300">
            {context}
          </p>
        </div>
      </div>
    </a>
  );
};

export default FeatureCard;