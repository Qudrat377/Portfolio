function Button({ stayles }) {
  return (
    <button
      className={`py-3 px-6 font-sans-serif font-medium text-[18px] bg-blue-gradient rounded-[10px] outline-none 
      
      /* Hover effektlari */
      hover:scale-105            /* Biroz kattalashadi */
      hover:shadow-lg            /* Soya paydo bo'ladi */
      hover:shadow-blue-500/50   /* Soya rangi ko'k bo'ladi */
      
      /* Effektlar yumshoq sodir bo'lishi uchun */
      transition-all duration-300 ease-in-out 
      
      active:scale-95            /* Bosilganda biroz kichrayadi (klik effekti) */
      
      ${stayles}`}
    >
      CV ni yuklab olish
    </button>
  );
}

export default Button;

// function Button({ stayles }) {
//   return (
//     <button
//       className={`py-3 px-6 font-sans-serif font-medium text-[18px] bg-blue-gradient rounded-[10px] outline-none ${stayles}`}
//     >
//       CV ni yuklash
//     </button>
//   );
// }

// export default Button;
