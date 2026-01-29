using Microsoft.AspNetCore.Mvc;

namespace giftusApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HelloWorldController : ControllerBase
    {
        /// <summary>
        /// Returns a simple Hello World message
        /// </summary>
        /// <returns>A greeting message</returns>
        [HttpGet]
        [Route("")]
        public IActionResult GetHelloWorld()
        {
            return Ok(new
            {
                message = "Hello World!",
                timestamp = DateTime.UtcNow,
                service = "Giftus API",
                version = "1.0.0"
            });
        }

        /// <summary>
        /// Returns a personalized greeting
        /// </summary>
        /// <param name="name">The name to greet</param>
        /// <returns>A personalized greeting message</returns>
        [HttpGet]
        [Route("greet/{name}")]
        public IActionResult Greet(string name)
        {
            return Ok(new
            {
                message = $"Hello, {name}!",
                timestamp = DateTime.UtcNow,
                service = "Giftus API"
            });
        }

        /// <summary>
        /// Health check endpoint
        /// </summary>
        /// <returns>Service health status</returns>
        [HttpGet]
        [Route("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                uptime = "running"
            });
        }
    }
}
