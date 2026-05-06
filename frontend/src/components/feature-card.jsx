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
  const url_path = url === "" ? "https://t.me/Malenkiy_master" : url;

  return (
    <a 
      href={url_path} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block no-underline group"
    >
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-[30px] cursor-pointer glassmorphism transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_15px_40px_rgba(0,246,255,0.2)] hover:bg-cyan-900/20 group w-36 h-36 sm:w-40 sm:h-40 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-cyan-400/30"></div>
        
        {/* Ikonka konteyneri */}
        <div className={`w-16 h-16 rounded-full flex justify-center items-center bg-gradient-to-br from-[#00040f] to-[#00102a] border border-cyan-500/40 shadow-[0_0_15px_rgba(0,246,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,246,255,0.5)] group-hover:border-cyan-400 transition-all duration-300 relative z-10 mb-3`}>
          <IconComponent
            size={28}
            className="text-gray-400 group-hover:text-[#00f6ff] transition-colors duration-300"
          />
        </div>

        {/* Matn qismi */}
        <h4 className="font-poppins font-semibold text-white text-[15px] sm:text-[16px] text-center group-hover:text-cyan-400 transition-colors duration-300 relative z-10">
          {title}
        </h4>
        
        {/* Context qismi tooltip sifatida yoki juda kichik matn ko'rinishida yashirilgan bo'lishi ham mumkin */}
        <p className="font-poppins text-gray-400 text-[10px] sm:text-[11px] text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-3 px-2 line-clamp-1 w-full left-0">
          {context}
        </p>
      </div>
    </a>
  );
};

export default FeatureCard;