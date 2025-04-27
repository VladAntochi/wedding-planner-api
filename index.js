import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import weddingDetailsRoutes from "./routes/weddingDetails.js";
import todosRoutes from "./routes/todos.js";
import budgetPlannerRoutes from "./routes/budgetPlanner.js";
import guestsRoutes from "./routes/guests.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/weddingDetails", weddingDetailsRoutes);
app.use("/todos", todosRoutes);
app.use("/budgetPlanner", budgetPlannerRoutes);
app.use("/guests", guestsRoutes);

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Search for a business (photographers, caterers, etc.) near a given location
app.get("/search-businesses", async (req, res) => {
  const { lat, lng, type } = req.query; // Expecting lat, lng, and business type (photographer, caterer)

  //   if (!lat || !lng || !type) {
  //     return res.status(400).json({
  //       error: "Please provide lat, lng, and type (e.g. photographer, caterer)",
  //     });
  //   }

  try {
    // Construct the URL for the Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`, // The location of the user (latitude, longitude)
        radius: 5000, // Search radius in meters (5 km in this case)
        type, // Business type (photographer, caterer, etc.)
        key: GOOGLE_API_KEY, // Your API key
      },
    });

    // Send back the results from Google Places API
    res.json(response.data.results);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error fetching data from Google Places API" });
  }
});

async function getCityFromCoordinates(lat, lng) {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== "OK" || !data.results.length) {
      console.error("Geocoding failed:", data.status);
      return null;
    }

    // Look for 'locality' (city/town), fallback to 'postal_town' if needed
    const addressComponents = data.results[0].address_components;
    const cityComponent = addressComponents.find(
      (component) =>
        component.types.includes("locality") ||
        component.types.includes("postal_town")
    );

    return cityComponent?.long_name || null;
  } catch (err) {
    console.error("Error during reverse geocoding:", err);
    return null;
  }
}

app.get("/search-vendors", async (req, res) => {
  const { query, location } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const textQuery = `${query}${location ? ` in ${location}` : ""}`;

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      textQuery
    )}&key=${GOOGLE_API_KEY}&radius=${30000}`;

    const response = await axios.get(url);

    const places = response.data.results;

    const transformedData = await Promise.all(
      places.map(async (place) => ({
        id: place.place_id || place.id,
        name: place.name,
        location: await getCityFromCoordinates(
          place?.geometry?.location?.lat,
          place?.geometry?.location?.lng
        ),
        rating: place.rating,
        numberOfReviews: place.user_ratings_total,
        image:
          place.photos && place.photos.length > 0
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : "https://via.placeholder.com/400x200?text=No+Image",
      }))
    );

    res.json(transformedData); // Return just the relevant vendor data
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch vendors", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
