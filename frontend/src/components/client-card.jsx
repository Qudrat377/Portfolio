import { styles } from "../Util/style"

function ClientCard({logo}) {
  return (
    <div className={`flex-1 ${styles.flexCenter} sm:min-w-48 min-w-30 m-5`}>
        <img src={logo} alt="client-logo" className="sm:w-48 w-25 object-contain" />
    </div>
  )
}

export default ClientCard