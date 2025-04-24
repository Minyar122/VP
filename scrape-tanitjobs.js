const axios = require("axios");
const cheerio = require("cheerio");

const scrapeLinkedInJobURL = async (url) => {
  const jobPosting = {
    role: "",
    company: "",
    details: "",
  };

  try {
    // Make request to job posting URL
    const response = await axios.get(url);
    const data = response?.data;

    // Initialize cheerio API with response body (HTML)
    const $ = cheerio.load(data);

    // Find the role and company from the job posting HTML
    const role = $(".top-card-layout__title").text().trim();
    const company = $(".topcard__org-name-link").text().trim();

    // Get the job description container to extract details
    const descriptionContainer = $(".description__text .show-more-less-html__markup").first();

    // Find every list within the job description to retrieve the details/requirements
    let description = [];
    descriptionContainer.find("ul").each((_, ul) => {
      let descriptionSection = `${$(ul).prev().text().trim()}\n`;
      $(ul)
        .find("li")
        .each((_, li) => {
          descriptionSection += `${$(li).text().trim()}\n`;
        });
      description.push(descriptionSection);
    });

    if (description.length === 0) {
      throw new Error("No job details found");
    }

    // Assign the scraped data to the job posting object
    jobPosting.role = role;
    jobPosting.company = company;
    jobPosting.details = description.join("\n");

  } catch (error) {
    console.error("Error scraping job details:", error);
    throw error; // Re-throw error for handling further up if necessary
  }

  return jobPosting;
};

module.exports = scrapeLinkedInJobURL;
