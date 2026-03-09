import { useLocation, useNavigate } from "react-router-dom";

function Recommendation() {

  const location = useLocation();
  const navigate = useNavigate();

  const policies = location.state?.policies;

  if (!policies) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>No recommendations found</h2>
        <button onClick={() => navigate("/")}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>Recommended Policies</h2>

      {policies.map((policy) => (
        <div
          key={policy.policy_id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            margin: "15px 0",
            borderRadius: "8px"
          }}
        >
          <h3>{policy.title}</h3>

          <p>
            <strong>Premium:</strong> ₹{policy.premium}
          </p>

          <p>
            <strong>Score:</strong> {policy.score}
          </p>

          <p>
            <strong>Why Recommended:</strong> {policy.reason}
          </p>

        </div>
      ))}
    </div>
  );
}

export default Recommendation;


// import { useEffect, useState } from "react";

// function Recommendation() {

// const [policies, setPolicies] = useState([]);

// useEffect(() => {


// const storedPolicies = localStorage.getItem("recommendations");

// if (storedPolicies) {
//   setPolicies(JSON.parse(storedPolicies));
// }


// }, []);

// return (
// <div style={{ padding: "40px" }}> <h2>Recommended Policies</h2>

//   {policies.length === 0 ? (
//     <p>No recommendations found.</p>
//   ) : (
//     policies.map((policy) => (
//       <div
//         key={policy.policy_id}
//         style={{
//           border: "1px solid #ccc",
//           padding: "15px",
//           margin: "15px 0",
//           borderRadius: "8px",
//         }}
//       >
//         <h3>{policy.title}</h3>

//         <p>
//           <strong>Premium:</strong> ₹{policy.premium}
//         </p>

//         <p>
//           <strong>Score:</strong> {policy.score}
//         </p>

//         <p>
//           <strong>Why Recommended:</strong> {policy.reason}
//         </p>

//       </div>
//     ))
//   )}
// </div>

// );
// }

// export default Recommendation;



// // import { useEffect, useState } from "react";
// // import axios from "axios";

// // function Recommendation() {
// //   const [policies, setPolicies] = useState([]);

// //   useEffect(() => {
// //     const token = localStorage.getItem("token");

// //     if (!token) {
// //       alert("Please login first");
// //       return;
// //     }

// //     axios
// //       .get("http://127.0.0.1:8000/recommendations/", {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       })
// //       .then((response) => {
// //         setPolicies(response.data);
// //       })
// //       .catch((error) => {
// //         console.error(error);
// //         alert("Failed to fetch recommendations");
// //       });
// //   }, []);

// //   return (
// //     <div style={{ padding: "40px" }}>
// //       <h2>Recommended Policies</h2>

// //       {policies.length === 0 ? (
// //         <p>No recommendations found.</p>
// //       ) : (
// //         policies.map((policy) => (
// //           <div
// //             key={policy.policy_id}
// //             style={{
// //               border: "1px solid #ccc",
// //               padding: "15px",
// //               margin: "15px 0",
// //               borderRadius: "8px",
// //             }}
// //           >
// //             <h3>{policy.title}</h3>

// //             <p>
// //               <strong>Premium:</strong> ₹{policy.premium}
// //             </p>
// //             <p>
// //               <strong>Score:</strong> {policy.score}
// //             </p>
// //             <p>
// //               <strong>Why Recommended:</strong> {policy.reason}
// //             </p>
// //           </div>
// //         ))
// //       )}
// //     </div>
// //   );
// // }

// // export default Recommendation;


// // // import { useEffect, useState } from "react";
// // // import axios from "axios";

// // // function Recommendation() {
// // //   const [policies, setPolicies] = useState([]);

// // //   useEffect(() => {
// // //     const token = localStorage.getItem("token");

// // //     if (!token) {
// // //       alert("Please login first");
// // //       return;
// // //     }

// // //     axios
// // //       .get("http://127.0.0.1:8000/recommendations/", {
// // //         headers: {
// // //           Authorization: `Bearer ${token}`,
// // //         },
// // //       })
// // //       .then((response) => {
// // //         setPolicies(response.data);
// // //       })
// // //       .catch((error) => {
// // //         console.error(error);
// // //         alert("Failed to fetch recommendations");
// // //       });
// // //   }, []);

// // //   return (
// // //     <div style={{ padding: "40px" }}>
// // //       <h2>Recommended Policies</h2>

// // //       {policies.length === 0 ? (
// // //         <p>No recommendations found.</p>
// // //       ) : (
// // //         policies.map((policy) => (
// // //           <div
// // //             key={policy.policy_id}
// // //             style={{
// // //               border: "1px solid #ccc",
// // //               padding: "15px",
// // //               margin: "15px 0",
// // //               borderRadius: "8px",
// // //             }}
// // //           >
// // //             <h3>{policy.title}</h3>

// // //             <p>
// // //               <strong>Premium:</strong> ₹{policy.premium}
// // //             </p>
// // //             <p>
// // //               <strong>Score:</strong> {policy.score}
// // //             </p>
// // //             <p>
// // //               <strong>Why Recommended:</strong> {policy.reason}
// // //             </p>
// // //           </div>
// // //         ))
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // export default Recommendation;
