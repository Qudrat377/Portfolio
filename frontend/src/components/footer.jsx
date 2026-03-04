import { logo } from "../assets"
import { footerLinks, socialMedia } from "../Util/constants"
import { styles } from "../Util/style"
import LinkCard from "./link-card"

function Footer() {
  return (
    <div className={`${styles.flexCenter} ${styles.paddingY} flex-col`}>
        <div className={`${styles.flexStart} md:flex-row flex-col mb-8 w-full`}>
            <div className={`flex-1 flex flex-col justify-start mr-10`}>
                <img src={logo} alt="logo" className={`w-62.5 h-18 object-contain`}/>
                <p className={`${styles.paragraph} mt-4 max-w-87.5`}>To'lovlarni oson, ishonchli va xavfsiz qilishning yangi usuli</p>
            </div>

            <div className={`flex-[1.5] w-full flex flex-row justify-between flex-wrap md:mt-0 mt-10`}>
                {footerLinks.map(Linkss => (
                    // <LinkCard key={idx} {...footerLinkss}  className={`flex flex-col ss:my-0 my-4 min-w-37.5`}/>
                    <div key={Linkss.title} className={`flex flex-col ss:my0 my-4 min-w-37.5`}>
                    <h4 className={`font-sans-serif font-medium text-[18px] leading-6.75 text-white`}>
                        {Linkss.title}
                    </h4>
                    <ul className={`list-none mt-4`}>
                        {Linkss.links.map((item, idx) => (
                            <li key={item.name} className={`font-sans-serif font-normal text-[16px] leading-6 text-lightWhite hover:text-secondary cursor-pointer ${idx !== Linkss.links.length - 1 ? "mb-4" : "mb-0"}`}>{item.name}</li>
                        ))}
                    </ul>
                    </div>
                ))}
            </div>
        </div>

        <div className={`w-full flex justify-between items-center md:flex-row flex-col pt-6 border-t border-t-[#3f3e45]`}>
            <p className={`font-sans-serif font-normal text-center text-[18px] leading-6.75 text-white`}>
                Copyright © 2023 SammiPay. All Right Reserved
            </p>

            <div className={`flex flex-row md:mt-0 mt-6`}>
                {socialMedia.map((social, idx) => (
                    <img key={social.id} src={social.icon} alt={social.id} className={`w-5 h-5.25 object-contain cursor-pointer ${idx !== socialMedia.length - 1 ? "mr-6" : "mr-0"}`}/>
                ))}
            </div>
        </div>
    </div>
  )
}

export default Footer