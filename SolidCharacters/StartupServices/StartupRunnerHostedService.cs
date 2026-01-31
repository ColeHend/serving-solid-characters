using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SolidCharacters.Domain.Core;

namespace SolidCharacters.HostedServices
{
    public sealed class StartupRunnerHostedService : IHostedService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public StartupRunnerHostedService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var runners = scope.ServiceProvider.GetServices<IRunOnStartup>();

            foreach (var runner in runners)
            {
                runner.Run();
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
