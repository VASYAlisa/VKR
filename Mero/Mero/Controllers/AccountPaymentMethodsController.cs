using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace Mero.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountPaymentMethodsController : ControllerBase
    {
        private readonly MeroContext _context;

        public AccountPaymentMethodsController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/AccountPaymentMethods
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountPaymentMethodDto>>> GetPaymentMethods()
        {
            try
            {
                var paymentMethods = await _context.AccountPaymentMethods
                    .ToListAsync();
                return paymentMethods.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPaymentMethods: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/AccountPaymentMethods/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AccountPaymentMethodDto>> GetPaymentMethod(int id)
        {
            try
            {
                var method = await _context.AccountPaymentMethods
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (method == null)
                {
                    return NotFound();
                }

                return MapToDto(method);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPaymentMethod: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/AccountPaymentMethods/ByAccount/5
        [HttpGet("ByAccount/{accountId}")]
        public async Task<ActionResult<IEnumerable<AccountPaymentMethodDto>>> GetPaymentMethodsByAccount(int accountId)
        {
            try
            {
                var paymentMethods = await _context.AccountPaymentMethods
                    .Where(p => p.AccountId == accountId)
                    .ToListAsync();
                return paymentMethods.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPaymentMethodsByAccount: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/AccountPaymentMethods
        [HttpPost]
        public async Task<ActionResult<AccountPaymentMethodDto>> CreatePaymentMethod(AccountPaymentMethodCreateDto dto)
        {
            try
            {
                if (!_context.Accounts.Any(a => a.Id == dto.AccountId))
                {
                    return BadRequest("Account not found");
                }

                var method = new AccountPaymentMethod
                {
                    Type = dto.Type,
                    Details = MaskPaymentDetails(dto.Details),
                    AccountId = dto.AccountId
                };

                _context.AccountPaymentMethods.Add(method);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPaymentMethod), new { id = method.Id }, MapToDto(method));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreatePaymentMethod: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/AccountPaymentMethods/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePaymentMethod(int id, AccountPaymentMethodUpdateDto dto)
        {
            try
            {
                var method = await _context.AccountPaymentMethods.FindAsync(id);
                if (method == null)
                {
                    return NotFound();
                }

                method.Type = dto.Type;
                if (!string.IsNullOrEmpty(dto.Details))
                {
                    method.Details = MaskPaymentDetails(dto.Details);
                }

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PaymentMethodExists(id))
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
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdatePaymentMethod: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/AccountPaymentMethods/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymentMethod(int id)
        {
            try
            {
                var method = await _context.AccountPaymentMethods.FindAsync(id);
                if (method == null)
                {
                    return NotFound();
                }

                _context.AccountPaymentMethods.Remove(method);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeletePaymentMethod: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, "Internal server error");
            }
        }

        private bool PaymentMethodExists(int id)
        {
            return _context.AccountPaymentMethods.Any(e => e.Id == id);
        }

        private static string MaskPaymentDetails(string details)
        {
            if (string.IsNullOrEmpty(details))
                return details;
            if (details.Length <= 4)
                return "****";
            return new string('*', details.Length - 4) + details.Substring(details.Length - 4);
        }

        private static AccountPaymentMethodDto MapToDto(AccountPaymentMethod method)
        {
            return new AccountPaymentMethodDto
            {
                Id = method.Id,
                Type = method.Type,
                MaskedDetails = method.Details,
                AccountId = method.AccountId,
            };
        }
    }

    public class AccountPaymentMethodDto
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string MaskedDetails { get; set; }
        public int AccountId { get; set; }
    }

    public class AccountPaymentMethodCreateDto
    {
        [Required]
        public string Type { get; set; }
        [Required]
        public string Details { get; set; }
        [Required]
        public int AccountId { get; set; }
    }

    public class AccountPaymentMethodUpdateDto
    {
        [Required]
        public string Type { get; set; }
        public string Details { get; set; }
    }
}