import { useParams } from "react-router-dom";
const CountyDetails = () => {
  const { name } = useParams();
  // Fetch the details of thecounty using the name
  return (
    <div>
      <h1>{name}</h1>
      {/* Display the details of the county */}
    </div>
  );
};
export default CountyDetails;
