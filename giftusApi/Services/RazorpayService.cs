using System.Security.Cryptography;
using System.Text;

namespace giftusApi.Services;

public interface IRazorpayService
{
    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);
    string GenerateOrderIdForRazorpay(int orderId);
}

public class RazorpayService : IRazorpayService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RazorpayService> _logger;

    public RazorpayService(IConfiguration configuration, ILogger<RazorpayService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        try
        {
            var keySecret = _configuration["Razorpay:KeySecret"] ?? throw new Exception("Razorpay KeySecret not configured");

            // Create the string to verify: {orderId}|{paymentId}
            var text = $"{orderId}|{paymentId}";

            // Create HMAC SHA256 signature
            var keyBytes = Encoding.ASCII.GetBytes(keySecret);
            using (var hmac = new HMACSHA256(keyBytes))
            {
                var computedSignature = hmac.ComputeHash(Encoding.ASCII.GetBytes(text));
                var computedSignatureString = Convert.ToHexString(computedSignature).ToLower();

                var isValid = computedSignatureString == signature;

                if (!isValid)
                {
                    _logger.LogWarning($"Payment signature verification failed for orderId: {orderId}");
                }

                return isValid;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error verifying payment signature: {ex.Message}");
            return false;
        }
    }

    public string GenerateOrderIdForRazorpay(int orderId)
    {
        return $"order_{orderId}_{DateTime.UtcNow.Ticks}";
    }
}
