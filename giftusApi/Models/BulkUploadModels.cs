namespace giftusApi.Models;

public class BulkUploadSummary
{
    public int TotalRows { get; set; }
    public int SuccessfulRows { get; set; }
    public int FailedRows { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class MatrixProductData
{
    public string ModelNo { get; set; }
    public string Size { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string ImageUrl { get; set; }
    public string Links { get; set; }
    public string HsnGst { get; set; }
    public decimal GstPercent { get; set; }
}
