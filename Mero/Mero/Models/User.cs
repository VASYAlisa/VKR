using Microsoft.AspNetCore.Identity;

namespace Mero.Models
{
    public class User: IdentityUser
    {
        public int? AccountId { get; set; }
        public virtual Account? Account { get; set; }
    }
}