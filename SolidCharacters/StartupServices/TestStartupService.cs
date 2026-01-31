using SolidCharacters.Domain.Core;

namespace SolidCharacters.HostedServices
{
    public sealed class TestStartupService : IRunOnStartup
    {
        public void Run()
        {
            Console.WriteLine("Hello this runs on startup!\n");
        }
    }
}
