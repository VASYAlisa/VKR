using Mero.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("api/[controller]")]
public class PromoCodesController : ControllerBase
{
    private readonly MeroContext _context;

    public PromoCodesController(MeroContext context)
    {
        _context = context;
    }

    // GET: api/PromoCodes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromoCodeDto>>> GetPromoCodes()
    {
        // Сначала получаем данные из базы
        var promoCodes = await _context.PromoCodes
            .Include(p => p.Event)
            .ToListAsync();

        // Затем преобразуем их в DTO
        var promoCodeDtos = promoCodes.Select(p => MapToDto(p)).ToList();

        return promoCodeDtos;
    }

    // GET: api/PromoCodes/5
    [HttpGet("{id}")]
    public async Task<ActionResult<PromoCodeDto>> GetPromoCode(int id)
    {
        var promoCode = await _context.PromoCodes
            .Include(p => p.Event)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (promoCode == null)
        {
            return NotFound();
        }

        return MapToDto(promoCode);
    }

    // GET: api/PromoCodes/ByTitle/NURLAN
    [HttpGet("ByTitle/{title}")]
    public async Task<ActionResult<PromoCode>> GetPromoCodeByTitle(string title)
    {
        try
        {
            var promoCode = await _context.PromoCodes
                .Include(p => p.Event)
                .FirstOrDefaultAsync(p => p.Title == title);

            if (promoCode == null)
            {
                return NotFound("Промокод не найден");
            }

            return promoCode;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPromoCodeByTitle: {ex.Message}\nStackTrace: {ex.StackTrace}");
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/PromoCodes
    [HttpPost]
    public async Task<ActionResult<PromoCodeDto>> CreatePromoCode(PromoCodeCreateDto dto)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == dto.EventId);
        if (!eventExists)
        {
            return BadRequest("Event not found");
        }

        var promoCode = new PromoCode
        {
            Title = dto.Title,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MaxUsages = dto.MaxUsages,
            ValidUntil = dto.ValidUntil,
            EventId = dto.EventId,
            IsActive = true
        };

        _context.PromoCodes.Add(promoCode);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPromoCode),
            new { id = promoCode.Id },
            MapToDto(promoCode));
    }

    // PUT: api/PromoCodes/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePromoCode(int id, PromoCodeUpdateDto dto)
    {
        var promoCode = await _context.PromoCodes.FindAsync(id);
        if (promoCode == null)
        {
            return NotFound();
        }

        promoCode.Title = dto.Title;
        promoCode.DiscountType = dto.DiscountType;
        promoCode.DiscountValue = dto.DiscountValue;
        promoCode.MaxUsages = dto.MaxUsages;
        promoCode.ValidUntil = dto.ValidUntil;
        promoCode.IsActive = dto.IsActive;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PromoCodeExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/PromoCodes/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePromoCode(int id)
    {
        var promoCode = await _context.PromoCodes.FindAsync(id);
        if (promoCode == null)
        {
            return NotFound();
        }

        _context.PromoCodes.Remove(promoCode);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool PromoCodeExists(int id)
    {
        return _context.PromoCodes.Any(e => e.Id == id);
    }

    private PromoCodeDto MapToDto(PromoCode promoCode)
    {
        return new PromoCodeDto
        {
            Id = promoCode.Id,
            Title = promoCode.Title,
            DiscountType = promoCode.DiscountType,
            DiscountValue = promoCode.DiscountValue,
            MaxUsages = promoCode.MaxUsages,
            UsagesCount = promoCode.UsagesCount,
            ValidUntil = promoCode.ValidUntil,
            IsActive = promoCode.IsActive,
            EventId = promoCode.EventId,
            EventTitle = promoCode.Event != null ? promoCode.Event.Title : "Событие не найдено"
        };
    }
}

// DTO для промокодов
public class PromoCodeDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public int? MaxUsages { get; set; }
    public int UsagesCount { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; }
    public int EventId { get; set; }
    public string EventTitle { get; set; }
}

public class PromoCodeCreateDto
{
    [Required]
    public string Title { get; set; }
    [Required]
    public string DiscountType { get; set; }
    [Range(0, 100)]
    public decimal DiscountValue { get; set; }
    public int? MaxUsages { get; set; }
    [Required]
    public DateTime ValidUntil { get; set; }
    [Required]
    public int EventId { get; set; }
}

public class PromoCodeUpdateDto
{
    [Required]
    public string Title { get; set; }
    [Required]
    public string DiscountType { get; set; }
    [Range(0, 100)]
    public decimal DiscountValue { get; set; }
    public int? MaxUsages { get; set; }
    [Required]
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; }
}