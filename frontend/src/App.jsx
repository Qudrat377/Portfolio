import { Billing, Business, Contract, CTA, Footer, Navbar, Statistics } from "./components"
import About_me from "./components/about_me"
import Learn from "./components/learn"
import Skills from "./components/skills"
import Works from "./components/works"
import {styles} from "./Util/style"

function App() {
  return (
    <div className="bg-primary w-full overflow-hidden">

      {/* Navbar  */}
      <div className={`${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.container}`}>
            <Navbar />
        </div>
      </div>

      {/* Home  */}
      <div className={`bg-primary ${styles.flexStart}`}>
        <div className={styles.container}>
            <About_me />
        </div>
      </div>


      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.container}`}>
            <Statistics />
            <Learn />
            {/* <Billing /> */}
            <Skills />
            <Works />
            <Business />
            {/* <Clients /> */}
            {/* <CTA /> */}
            {/* <Footer /> */}
        </div>
      </div>
    </div>
  )
}

export default App
