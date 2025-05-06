using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mero.Models;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace Mero.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Требуется авторизация
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;

        public UserController(UserManager<User> userManager, SignInManager<User> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        // GET: api/User/Profile
        [HttpGet("Profile")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _userManager.GetUserAsync(HttpContext.User);
            if (user == null)
            {
                return Unauthorized(new { message = "Пользователь не найден" });
            }

            return Ok(new
            {
                userName = user.UserName,
                email = user.Email,
                phoneNumber = user.PhoneNumber
            });
        }

        // POST: api/User/UpdatePhoneNumber
        [HttpPost("UpdatePhoneNumber")]
        public async Task<IActionResult> UpdatePhoneNumber([FromBody] UpdatePhoneNumberModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = "Неверные входные данные",
                    errors = ModelState.Values.SelectMany(e => e.Errors.Select(er => er.ErrorMessage))
                });
            }

            var user = await _userManager.GetUserAsync(HttpContext.User);
            if (user == null)
            {
                return Unauthorized(new { message = "Пользователь не найден" });
            }

            user.PhoneNumber = model.PhoneNumber;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Не удалось обновить номер телефона",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new { message = "Номер телефона успешно обновлён" });
        }

        // POST: api/User/ChangePassword
        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = "Неверные входные данные",
                    errors = ModelState.Values.SelectMany(e => e.Errors.Select(er => er.ErrorMessage))
                });
            }

            var user = await _userManager.GetUserAsync(HttpContext.User);
            if (user == null)
            {
                return Unauthorized(new { message = "Пользователь не найден" });
            }

            var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Не удалось сменить пароль",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            // Обновляем сессию, чтобы пользователь не был разлогинен
            await _signInManager.RefreshSignInAsync(user);

            return Ok(new { message = "Пароль успешно изменён" });
        }
    }

    public class UpdatePhoneNumberModel
    {
        [Required]
        [RegularExpression(@"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$", ErrorMessage = "Номер телефона должен быть в формате +7 (XXX) XXX-XX-XX")]
        public string PhoneNumber { get; set; }
    }

    public class ChangePasswordModel
    {
        [Required]
        public string OldPassword { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Пароль должен содержать минимум 6 символов", MinimumLength = 6)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру")]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword", ErrorMessage = "Пароли не совпадают")]
        public string ConfirmNewPassword { get; set; }
    }
}