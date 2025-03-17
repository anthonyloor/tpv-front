const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname.includes("mayret.com")) {
    return "https://api.mayret.com";
  }
  return "https://apitpv.anthonyloor.com";
};

export default getApiBaseUrl;
