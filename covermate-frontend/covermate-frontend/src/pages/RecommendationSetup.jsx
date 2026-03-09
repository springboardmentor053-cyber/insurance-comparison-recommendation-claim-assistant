// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const RecommendationSetup = () => {
//   const navigate = useNavigate();

//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [familySize, setFamilySize] = useState("");
//   const [maritalStatus, setMaritalStatus] = useState("");
//   const [budget, setBudget] = useState("");
//   const [healthCondition, setHealthCondition] = useState("");

//   const token = localStorage.getItem("token");

//   // Calculate age from DOB
//   const calculateAge = (dob) => {
//     const birthDate = new Date(dob);
//     const today = new Date();
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const m = today.getMonth() - birthDate.getMonth();

//     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }

//     return age;
//   };

//   // Fetch profile
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/auth/me", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         setProfile(res.data);
//       } catch (error) {
//         console.error("Error fetching profile:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [token]);

//   // Submit preferences
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await axios.post(
//         "http://localhost:8000/recommendations/generate",
//         {
//           family_size: familySize,
//           marital_status: maritalStatus,
//           budget: budget,
//           health_condition: healthCondition,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       // Navigate to recommendations page with data
//       navigate("/recommendations", { state: { policies: res.data } });

//     } catch (error) {
//       console.error("Recommendation error:", error);
//       alert("Failed to generate recommendations");
//     }
//   };

//   // if (loading) return <div>Loading profile...</div>;

//    if (loading || !profile) {
//   return <div>Loading profile...</div>;
// }

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(to right, #2c6ed5, #5c86ff)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           padding: "40px",
//           borderRadius: "15px",
//           width: "500px",
//           boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
//         }}
//       >
//         <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
//           Insurance Recommendation Setup
//         </h2>

//         {/* User Summary */}
//         <div
//           style={{
//             background: "#f4f6f9",
//             padding: "15px",
//             borderRadius: "10px",
//             marginBottom: "20px",
//           }}
//         >
//           <h4>User Summary</h4>
//           <p><b>Name:</b> {profile.name}</p>
//           <p><b>Age:</b> {calculateAge(profile.dob)}</p>
//           <p><b>Income:</b> ₹{profile.annual_income}</p>
//           <p><b>Risk Profile:</b> {profile.risk_profile}</p>
//         </div>

//         {/* Preference Form */}
//         <form onSubmit={handleSubmit}>

//           <label>Family Size</label>
//           <select
//             value={familySize}
//             onChange={(e) => setFamilySize(e.target.value)}
//             required
//             style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
//           >
//             <option value="">Select</option>
//             <option value="1">1</option>
//             <option value="2">2</option>
//             <option value="3">3</option>
//             <option value="4">4+</option>
//           </select>

//           <label>Marital Status</label>
//           <select
//             value={maritalStatus}
//             onChange={(e) => setMaritalStatus(e.target.value)}
//             required
//             style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
//           >
//             <option value="">Select</option>
//             <option value="single">Single</option>
//             <option value="married">Married</option>
//           </select>

//           <label>Budget (Annual Premium)</label>
//           <input
//             type="number"
//             placeholder="Enter budget"
//             value={budget}
//             onChange={(e) => setBudget(e.target.value)}
//             required
//             style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
//           />

//           <label>Health Condition</label>
//           <select
//             value={healthCondition}
//             onChange={(e) => setHealthCondition(e.target.value)}
//             style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
//           >
//             <option value="none">None</option>
//             <option value="diabetes">Diabetes</option>
//             <option value="bp">Blood Pressure</option>
//             <option value="other">Other</option>
//           </select>

//           <button
//             type="submit"
//             style={{
//               width: "100%",
//               padding: "10px",
//               background: "#2c6ed5",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               fontSize: "16px",
//             }}
//           >
//             Get Recommendations
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default RecommendationSetup;



// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const RecommendationSetup = () => {

//   const navigate = useNavigate();

//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [familySize, setFamilySize] = useState("");

//   const token = localStorage.getItem("token");


//   // AGE CALCULATION
//   const calculateAge = (dob) => {

//     const birthDate = new Date(dob);
//     const today = new Date();

//     let age = today.getFullYear() - birthDate.getFullYear();
//     const m = today.getMonth() - birthDate.getMonth();

//     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }

//     return age;
//   };


//   // FETCH USER PROFILE
//   useEffect(() => {

//     const fetchProfile = async () => {

//       try {

//         const res = await axios.get(
//           "http://localhost:8000/auth/me",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`
//             }
//           }
//         );

//         setProfile(res.data);

//       } catch (error) {

//         console.error("Profile fetch error:", error);

//       } finally {

//         setLoading(false);

//       }
//     };

//     fetchProfile();

//   }, [token]);


//   // SUBMIT FORM
//   const handleSubmit = async (e) => {

//     e.preventDefault();

//     try {

//       const age = calculateAge(profile.dob);

//       const res = await axios.post(
//         "http://localhost:8000/recommendations/generate",
//         {
//           age: age,
//           family_size: parseInt(familySize)
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       navigate("/recommendations", { state: { policies: res.data } });

//     } catch (error) {

//       console.error("Recommendation error:", error);
//       alert("Failed to generate recommendations");

//     }

//   };


//   if (loading || !profile) {
//     return <div>Loading profile...</div>;
//   }


//   return (

//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(to right, #2c6ed5, #5c86ff)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center"
//       }}
//     >

//       <div
//         style={{
//           background: "#fff",
//           padding: "40px",
//           borderRadius: "15px",
//           width: "500px",
//           boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
//         }}
//       >

//         <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
//           Insurance Recommendation Setup
//         </h2>


//         {/* USER SUMMARY */}

//         <div
//           style={{
//             background: "#f4f6f9",
//             padding: "15px",
//             borderRadius: "10px",
//             marginBottom: "20px"
//           }}
//         >

//           <h4>User Summary</h4>

//           <p><b>Name:</b> {profile.name}</p>
//           <p><b>Age:</b> {calculateAge(profile.dob)}</p>
//           <p><b>Income:</b> ₹{profile.annual_income}</p>
//           <p><b>Risk Profile:</b> {profile.risk_profile}</p>

//         </div>


//         {/* FORM */}

//         <form onSubmit={handleSubmit}>

//           <label>Family Size</label>

//           <select
//             value={familySize}
//             onChange={(e) => setFamilySize(e.target.value)}
//             required
//             style={{
//               width: "100%",
//               padding: "8px",
//               marginBottom: "20px"
//             }}
//           >

//             <option value="">Select</option>
//             <option value="1">1</option>
//             <option value="2">2</option>
//             <option value="3">3</option>
//             <option value="4">4+</option>

//           </select>


//           <button
//             type="submit"
//             style={{
//               width: "100%",
//               padding: "10px",
//               background: "#2c6ed5",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               fontSize: "16px"
//             }}
//           >

//             Get Recommendations

//           </button>

//         </form>

//       </div>

//     </div>

//   );

// };

// export default RecommendationSetup;


import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RecommendationSetup = () => {

const navigate = useNavigate();

const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);

const [familySize, setFamilySize] = useState("");
const [budget, setBudget] = useState(20000);
const [healthStatus, setHealthStatus] = useState("");

const token = localStorage.getItem("token");

// AGE CALCULATION
const calculateAge = (dob) => {
const birthDate = new Date(dob);
const today = new Date();

let age = today.getFullYear() - birthDate.getFullYear();
const m = today.getMonth() - birthDate.getMonth();

if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
  age--;
}
return age;


};

// FETCH USER PROFILE
useEffect(() => {

const fetchProfile = async () => {

  try {

    const res = await axios.get(
      "http://localhost:8000/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setProfile(res.data);

  } catch (error) {

    console.error("Profile fetch error:", error);

  } finally {

    setLoading(false);

  }
};

fetchProfile();


}, [token]);

// SUBMIT FORM
const handleSubmit = async (e) => {


e.preventDefault();

try {

  const age = calculateAge(profile.dob);

  const res = await axios.post(
    "http://localhost:8000/recommendations/generate",
    {
      age: age,
      income: profile.annual_income,
      budget: budget,
      family_size: parseInt(familySize),
      health_status: healthStatus
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  // localStorage.setItem("recommendations", JSON.stringify(res.data));
  
  // navigate("/recommendations");
  navigate("/recommendations", { state: { policies: res.data } });

//   if (!res.data || res.data.length === 0) {
//   alert("No policies matched your criteria.");
//   return;
// }

//   navigate("/recommendations", { state: { policies: res.data } });

} catch (error) {

  console.error("Recommendation error:", error);
  alert("Failed to generate recommendations");

}


};

if (loading || !profile) {
return <div>Loading profile...</div>;
}

return (


<div
  style={{
    minHeight: "100vh",
    background: "linear-gradient(to right, #2c6ed5, #5c86ff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}
>

  <div
    style={{
      background: "#fff",
      padding: "40px",
      borderRadius: "15px",
      width: "500px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
    }}
  >

    <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
      Insurance Recommendation Setup
    </h2>


    {/* USER SUMMARY */}

    <div
      style={{
        background: "#f4f6f9",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: "20px"
      }}
    >

      <h4>User Summary</h4>

      <p><b>Name:</b> {profile.name}</p>
      <p><b>Age:</b> {calculateAge(profile.dob)}</p>
      <p><b>Income:</b> ₹{profile.annual_income}</p>
      <p><b>Risk Profile:</b> {profile.risk_profile}</p>

    </div>


    {/* FORM */}

    <form onSubmit={handleSubmit}>

      {/* FAMILY SIZE */}

      <label>Family Size</label>

      <select
        value={familySize}
        onChange={(e) => setFamilySize(e.target.value)}
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "20px"
        }}
      >

        <option value="">Select</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4+</option>

      </select>


      {/* BUDGET SLIDER */}

      <label>Budget (Annual Premium): ₹{budget}</label>

      <input
        type="range"
        min="5000"
        max="50000"
        step="1000"
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        style={{
          width: "100%",
          marginBottom: "20px"
        }}
      />


      {/* HEALTH STATUS */}

      <label>Health Status</label>

      <select
        value={healthStatus}
        onChange={(e) => setHealthStatus(e.target.value)}
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "20px"
        }}
      >

        <option value="">Select</option>
        <option value="good">Good</option>
        <option value="average">Average</option>
        <option value="critical">Critical</option>

      </select>


      <button
        type="submit"
        style={{
          width: "100%",
          padding: "10px",
          background: "#2c6ed5",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >

        Get Recommendations

      </button>

    </form>

  </div>

</div>


);

};

export default RecommendationSetup;
