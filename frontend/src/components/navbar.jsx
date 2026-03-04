import { useState } from "react"
import { close, logo, menu } from "../assets"
import { navigationLinks } from "../Util/constants"
import { styles } from "../Util/style"
import { Menu, X } from 'lucide-react';

function Navbar() {
    const [toggleNav, setToggleNav] = useState(false)
    const [active, setActive] = useState('home')

   const consttoggleHandler = () => setToggleNav(prev => !prev)
   const activeHandler = (id) => setActive(id)

  return (
    <div className={`w-full py-6 ${styles.flexBetween}`}>
        {/* logo  */}
        {/* <a href="/">
            <img src={logo} alt="logo" className={`w-32.5 h-12 cursor-pointer`} />
        </a> */}

        {/* navigation link  */}
        <ul className="list-none sm:flex hidden justify-end items-center flex-1">{navigationLinks.map((nav, idx) => (
            <li 
            key={nav.id} 
            className={`
             ${idx === navigationLinks.length - 1 ? "mr-0" : "mr-10"} 
             ${active === nav.id ? "text-white" : "text-lightWhite"}
             font-sans-serif font-normal cursor-pointer text-[30px] text-lightWhite hover:text-white transition-all duration-500`}
             onClick={() => activeHandler(nav.id)}
            >
                <a href={`#${nav.id}`} >{nav.title}</a>
            </li>
        ))}</ul>

        {/* Navigation btn  */}
        <div className="sm:hidden flex flex-1 justify-end items-center">
            {/* <img src={toggleNav ? close : menu} 
            width={100} height={100} alt="nav" 
            className="w-7.5 object-contain" 
            onClick={consttoggleHandler} /> */}
            {toggleNav ? <X size={32} onClick={consttoggleHandler} color="white"/> : <Menu color="white" size={32} onClick={consttoggleHandler}/>}
         <div className={`${toggleNav ? "hidden" : "flex"} p-6 absolute top-19 right-0 left-0 w-full sidebar bg-black-gradient z-99`}>

            <ul className="list-none flex justify-center items-center flex-1">{navigationLinks.map((nav, idx) => (
                <li
                    key={nav.id} 
                    className={`
                    ${idx === navigationLinks.length - 1 ? "mr-0" : "mr-10"} 
                    ${active === nav.id ? "text-white" : "text-lightWhite"}
                    font-sans-serif font-normal cursor-pointer text-[16px] text-lightWhite hover:text-white transition-all duration-500`}
                    onClick={() => activeHandler(nav.id)}
                    >
                        <a href={`#${nav.id}`}>{nav.title}</a>
                </li>
            ))}
            </ul>
         </div>
        </div>
    </div>
  )
}

export default Navbar
