import { apple, bill, google } from "../assets"
import { layout, styles } from "../Util/style"

function Billing() {
  return (
    <section id="features" className={layout.sectionReverse}>
        <div className={layout.sectionImageReverse}>
            <img src={bill} alt="bill" className={`w-full h-full relative z-5`}/>
            
        {/* Gradient background */}
        <div className={`absolute z-3 -left-1/2 w-[50%] h-[55%] rounded-full top-0 white__gradien`}/>
        <div className={`absolute z-0 w-[50%] h-[50%] -left-1/2 bottom-0 rounded-full pink__gradient`}/>
        
        </div>
        <div className={layout.sectionInfo}>
            <h2 className={styles.heading2}>
                Hisob-kitob va fakturial BILLINGDAN <br className="sm-block hidden"/> osongina boshqaring
            </h2>
            <p className={`${styles.paragraph} max-w-137.5 mt-5`}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Et, eligendi praesentium. Unde facilis inventore quae consequuntur ipsam vel, numquam repellat.
            </p>

            <div className={`flex flex-row flex-wrap sm:mt-10 mt-6`}>
                <img src={google} alt="google" className={`w-32.25 h-10.5 object-contain mr-5 cursor-pointer`}/>
                <img src={apple} alt="apple" className={`w-32.25 h-10.5 object-contain mr-5 cursor-pointer`}/>
            </div>
        </div>
    </section>
  )
}

export default Billing