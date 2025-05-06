using Mero.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly MeroContext _context;

    public TicketsController(MeroContext context)
    {
        _context = context;
    }

    // DTO для создания билета
    public class TicketCreateDto
    {
        [Required]
        public int EventId { get; set; }
        public int? TicketTypeId { get; set; }
        public int[]? PlaceIds { get; set; }
        public int? PromoCodeId { get; set; }
        [Required]
        public int AccountId { get; set; }
        [Required]
        public int PaymentMethodId { get; set; }
    }

    // POST: api/Tickets
    [HttpPost]
    public async Task<ActionResult<Ticket>> CreateTicket(TicketCreateDto dto)
    {
        // Проверяем существование события
        var evt = await _context.Events
            .Include(e => e.TicketTypes)
            .Include(e => e.Hall)
            .ThenInclude(h => h.Places)
            .FirstOrDefaultAsync(e => e.Id == dto.EventId);

        if (evt == null)
        {
            return BadRequest("Событие не найдено");
        }

        // Проверяем существование аккаунта
        var account = await _context.Accounts
            .Include(a => a.AccountPaymentMethods)
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId);
        if (account == null)
        {
            return BadRequest("Аккаунт не найден");
        }

        // Проверяем способ оплаты
        var paymentMethod = account.AccountPaymentMethods
            .FirstOrDefault(pm => pm.Id == dto.PaymentMethodId);
        if (paymentMethod == null)
        {
            return BadRequest("Способ оплаты не найден");
        }

        // Проверяем промокод
        PromoCode? promoCode = null;
        if (dto.PromoCodeId.HasValue)
        {
            promoCode = await _context.PromoCodes
                .FirstOrDefaultAsync(p => p.Id == dto.PromoCodeId);
            if (promoCode == null || !promoCode.IsValid() || promoCode.EventId != evt.Id)
            {
                return BadRequest("Промокод недействителен или не применим к этому событию");
            }
        }

        // Определяем тип события и вычисляем стоимость
        decimal originalAmount = 0;
        decimal orderAmount = 0;
        var ticket = new Ticket
        {
            AccountId = dto.AccountId,
            EventId = dto.EventId,
            Date = DateTime.Now,
        };

        // Определяем places на уровне метода
        List<Place> places = null;

        await _context.Database.BeginTransactionAsync();

        try
        {
            if (evt.HallId.HasValue && dto.PlaceIds != null && dto.PlaceIds.Length > 0)
            {
                // Событие с залом
                places = await _context.Places
                    .Where(p => p.HallId == evt.HallId && dto.PlaceIds.Contains(p.Id))
                    .ToListAsync();

                if (places.Count != dto.PlaceIds.Length)
                {
                    return BadRequest("Одно или несколько мест не найдены");
                }

                // Проверяем, не забронированы ли места
                var bookedPlaces = places.Where(p => p.IsBooked).ToList();
                if (bookedPlaces.Any())
                {
                    return BadRequest($"Места {string.Join(", ", bookedPlaces.Select(p => $"{p.RowNumber}-{p.SeatNumber}"))} уже забронированы");
                }

                // Вычисляем стоимость
                originalAmount = places.Sum(p => p.Price);

                // Бронируем места
                foreach (var place in places)
                {
                    place.IsBooked = true;
                    ticket.TicketPlaces.Add(new TicketPlace
                    {
                        PlaceId = place.Id,
                        ActualPrice = place.Price,
                    });
                }
            }
            else if (evt.TicketTypes.Any() && dto.TicketTypeId.HasValue)
            {
                // Событие с категориями билетов
                var ticketType = evt.TicketTypes.FirstOrDefault(tt => tt.Id == dto.TicketTypeId);
                if (ticketType == null)
                {
                    return BadRequest("Категория билета не найдена");
                }

                // Проверяем доступность
                if (ticketType.MaxAvailable.HasValue && ticketType.SoldCount >= ticketType.MaxAvailable)
                {
                    return BadRequest($"Билеты категории {ticketType.Name} закончились");
                }

                originalAmount = ticketType.Price;
                ticket.TicketTypeId = ticketType.Id;

                // Увеличиваем счётчик проданных билетов
                ticketType.SoldCount++;
            }
            else if (evt.BasePrice.HasValue)
            {
                // Событие с фиксированной ценой
                var soldTickets = await _context.Tickets
                    .CountAsync(t => t.EventId == evt.Id);
                if (evt.MaxTickets.HasValue && soldTickets >= evt.MaxTickets)
                {
                    return BadRequest("Билеты на это событие закончились");
                }

                originalAmount = evt.BasePrice.Value;
            }
            else
            {
                return BadRequest("Невозможно определить тип события или цену");
            }

            // Применяем промокод
            orderAmount = originalAmount;
            if (promoCode != null)
            {
                // Дополнительная проверка перед увеличением UsagesCount
                if (promoCode.MaxUsages.HasValue && promoCode.UsagesCount >= promoCode.MaxUsages.Value)
                {
                    return BadRequest("Промокод достиг максимального количества использований");
                }

                if (promoCode.DiscountType == "Percentage")
                {
                    orderAmount = originalAmount * (1 - promoCode.DiscountValue / 100);
                }
                else if (promoCode.DiscountType == "Fixed")
                {
                    orderAmount = Math.Max(0, originalAmount - promoCode.DiscountValue);
                }
                promoCode.UsagesCount++;
                ticket.PromoCodeId = promoCode.Id;

                // Убедимся, что изменения в promoCode сохраняются
                _context.PromoCodes.Update(promoCode);
            }

            // Обновляем ActualPrice для мест с учётом скидки
            if (ticket.TicketPlaces.Any() && places != null)
            {
                decimal discountMultiplier = orderAmount / originalAmount;
                foreach (var ticketPlace in ticket.TicketPlaces)
                {
                    var place = places.First(p => p.Id == ticketPlace.PlaceId);
                    ticketPlace.ActualPrice = place.Price * discountMultiplier;
                }
            }

            ticket.OriginalAmount = originalAmount;
            ticket.OrderAmount = orderAmount;
            ticket.DiscountAmount = originalAmount - orderAmount;

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            await _context.Database.CommitTransactionAsync();
            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
        }
        catch (Exception ex)
        {
            await _context.Database.RollbackTransactionAsync();
            Console.WriteLine($"Ошибка при создании билета: {ex.Message}\nStackTrace: {ex.StackTrace}");
            return StatusCode(500, "Внутренняя ошибка сервера");
        }
    }

    // GET: api/Tickets/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Ticket>> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Event)
            .Include(t => t.TicketType)
            .Include(t => t.PromoCode)
            .Include(t => t.TicketPlaces)
            .ThenInclude(tp => tp.Place)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        return ticket;
    }

    // GET: api/Tickets/ByAccount/{accountId}
    [HttpGet("ByAccount/{accountId}")]
    public async Task<ActionResult<IEnumerable<Ticket>>> GetTicketsByAccount(int accountId)
    {
        try
        {
            var tickets = await _context.Tickets
                .Where(t => t.AccountId == accountId)
                .Include(t => t.Event)
                .ThenInclude(e => e.Location)
                .ThenInclude(l => l.City)
                .Include(t => t.TicketType)
                .Include(t => t.PromoCode)
                .Include(t => t.TicketPlaces)
                .ThenInclude(tp => tp.Place)
                .ToListAsync();

            return Ok(tickets);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при получении билетов: {ex.Message}\nStackTrace: {ex.StackTrace}");
            return StatusCode(500, "Внутренняя ошибка сервера");
        }
    }
}