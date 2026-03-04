import { clients } from "../Util/constants"
import { styles } from "../Util/style"
import ClientCard from "./client-card"

function Clients() {
  return (
    <div id="clients" className={`${styles.flexCenter} my-4`}>
        <div className={`${styles.flexCenter} flex-wrap w-full`}>
            {clients.map(client => (
                <ClientCard key={client.id} logo={client.logo}/>
            ))}
        </div>
    </div>
  )
}

export default Clients