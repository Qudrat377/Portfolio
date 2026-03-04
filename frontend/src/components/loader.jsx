import { styles } from "../Util/style";

const Loader = () => (
  <div className={`w-full py-10 ${styles.flexCenter}`}>
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default Loader;