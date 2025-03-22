import React, { useState } from "react";

const FashionRecommender = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Hardcoded backend URL (replace with your actual backend URL)
  const backendUrl = "http://localhost:4000";

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file)); // Preview Image
      setError(null); // Clear any previous errors
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please upload an image first!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      console.log("Sending request to backend...");
      
      const response = await fetch(`${backendUrl}/api/fashion/uploadImageAndPredict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch recommendations");
      }

      const data = await response.json();
      
      // Check if recommendations exist in the response
      if (data.recommendations && data.recommendations.length > 0) {
        console.log("Received recommendations:", data.recommendations);
        setRecommendedItems(data.recommendations);
        setError(null);
      } else {
        setError("No recommendations found for this image.");
        setRecommendedItems([]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError(error.message || "An error occurred while fetching recommendations");
      setRecommendedItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center">Fashion Recommender</h1>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image Upload Section */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/2">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Selected"
                className="w-64 h-64 object-cover rounded-lg border border-gray-300 mb-4 shadow-md"
              />
            ) : (
              <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">Upload an image</p>
              </div>
            )}

            <label className="bg-blue-500 text-white px-6 py-2 rounded-md cursor-pointer hover:bg-blue-600 transition w-full md:w-auto text-center">
              Choose File
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Instructions Section */}
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-2">How It Works</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-2">
              <li>Upload an image of a fashion item</li>
              <li>Click "Get Recommendations"</li>
              <li>Receive similar fashion items based on visual similarity</li>
            </ol>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? "Processing..." : "Get Recommendations"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Display Recommended Items */}
      {recommendedItems.length > 0 && (
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl font-semibold mb-4 text-center">Similar Fashion Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recommendedItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate" title={item.name}>
                    {item.name}
                  </h3>
                  {item.brand && (
                    <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                  )}
                  <p className="text-lg font-semibold">${parseFloat(item.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Similarity: {item.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FashionRecommender;





// import React, { useState } from "react";

// const FashionRecommender = () => {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [recommendedItems, setRecommendedItems] = useState([]);
//   const [error, setError] = useState(null);
  
//   // Hardcoded backend URL (replace with your actual backend URL)
//   const backendUrl = "http://localhost:4000";

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//       setImagePreview(URL.createObjectURL(file)); // Preview Image
//       setError(null); // Clear any previous errors
//     }
//   };

//   const handleSubmit = async () => {
//     if (!selectedFile) {
//       setError("Please upload an image first!");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("image", selectedFile);

//     try {

//       console.log("entered just before sending request from frontend");
      

//       const response = await fetch(`${backendUrl}/api/fashion/uploadImageAndPredict`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to fetch recommendations");
//       }

//       console.log(response);
      

//       const data = await response.json();
      
//       // Check if recommendations exist in the response
//       if (data.recommendations && data.recommendations.length > 0) {
//         setRecommendedItems(data.recommendations);
//         setError(null);
//       } else {
//         setError("No recommendations found for this image.");
//         setRecommendedItems([]);
//       }
//     } catch (error) {
//       console.error("Error fetching recommendations:", error);
//       setError(error.message || "An error occurred while fetching recommendations");
//       setRecommendedItems([]);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
//       <h1 className="text-2xl font-semibold mb-4">Fashion Recommender</h1>

//       {/* Image Preview */}
//       {imagePreview && (
//         <img
//           src={imagePreview}
//           alt="Selected"
//           className="w-48 h-48 object-cover rounded-lg border border-gray-300 mb-4 shadow-lg"
//         />
//       )}

//       {/* Error Message */}
//       {error && (
//         <div className="text-red-500 mb-4 text-center">
//           {error}
//         </div>
//       )}

//       {/* File Upload Button */}
//       <label className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition">
//         Choose File
//         <input type="file" onChange={handleFileChange} className="hidden" />
//       </label>

//       {/* Submit Button */}
//       <button
//         onClick={handleSubmit}
//         className="mt-4 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
//       >
//         Get Recommendations
//       </button>

//       {/* Display Recommended Items */}
//       {recommendedItems.length > 0 && (
//         <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
//           {recommendedItems.map((item, index) => (
//             <img
//               key={index}
//               src={item.image}
//               alt="Recommended Product"
//               className="w-40 h-40 object-cover rounded-md shadow-md"
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FashionRecommender;






// // import React, { useState,useContext } from "react";
// // import { ShopContext } from "../context/ShopContext";

// // const FashionRecommender = () => {
// //   const [selectedFile, setSelectedFile] = useState(null);
// //   const [imagePreview, setImagePreview] = useState(null);
// //   const [recommendedItems, setRecommendedItems] = useState([]);
// //   const {backendUrl} = useContext(ShopContext)

// //   const handleFileChange = (event) => {
// //     const file = event.target.files[0];
// //     if (file) {
// //       setSelectedFile(file);
// //       setImagePreview(URL.createObjectURL(file)); // Preview Image
// //     }
// //   };

// //   const handleSubmit = async () => {
// //     if (!selectedFile) {
// //       alert("Please upload an image first!");
// //       return;
// //     }

// //     const formData = new FormData();
// //     formData.append("image", selectedFile);

// //     try {
// //       const response = await fetch(backendUrl + '/api/fashion/uploadImageAndPredict', {
// //         method: "POST",
// //         body: formData,
// //       });


// //       console.log(response);
      
// //       console.log("error in backend for sure");
      
// //       if (!response.ok) {
// //         throw new Error("Failed to fetch recommendations");
// //       }

// //       const data = await response.json();
// //       setRecommendedItems(data.recommendations);
// //     } catch (error) {
// //       console.error("Error fetching recommendations:", error);
// //     }
// //   };

// //   return (
// //     <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
// //       <h1 className="text-2xl font-semibold mb-4">Fashion Recommender</h1>

// //       {/* Image Preview */}
// //       {imagePreview && (
// //         <img
// //           src={imagePreview}
// //           alt="Selected"
// //           className="w-48 h-48 object-cover rounded-lg border border-gray-300 mb-4 shadow-lg"
// //         />
// //       )}

// //       {/* File Upload Button */}
// //       <label className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition">
// //         Choose File
// //         <input type="file" onChange={handleFileChange} className="hidden" />
// //       </label>

// //       {/* Submit Button */}
// //       <button
// //         onClick={handleSubmit}
// //         className="mt-4 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
// //       >
// //         Get Recommendations
// //       </button>

// //       {/* Display Recommended Items */}
// //       {recommendedItems.length > 0 && (
// //         <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
// //           {recommendedItems.map((item, index) => (
// //             <img
// //               key={index}
// //               src={item.image_url}
// //               alt="Recommended"
// //               className="w-40 h-40 object-cover rounded-md shadow-md"
// //             />
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default FashionRecommender;
