import { PacmanLoader } from "react-spinners";

type PageLoaderProps = {
  active: boolean;
};

const PageLoader = ({ active }: PageLoaderProps) => {
  if (!active) return null;

  return (
    <div className="page-loader-overlay">
      <PacmanLoader color="#ffafdd" size={25} />
    </div>
  );
};

export default PageLoader;


