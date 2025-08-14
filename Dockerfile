#################################################################
# Build stage for .NET + Client (SolidJS)                        #
#################################################################
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only csproj first for restore caching
COPY SharpAnglesTemplate.csproj ./
RUN dotnet restore "SharpAnglesTemplate.csproj"

# Copy the rest of the backend source
COPY . .

# Install Node (use official distro-provided script) for SPA build
RUN apt-get update && apt-get install -y curl gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && npm --version && node --version

# Install client dependencies & build SPA (leveraging package-lock / pnpm lock if present)
WORKDIR /src/client
# Using npm; if you migrate to pnpm add it globally and adjust commands
RUN npm install
RUN npm run build

# Return to root and publish .NET (this will execute the PublishRunWebpack target which currently picks up wwwroot, adjust if needed)
WORKDIR /src
RUN dotnet publish "SharpAnglesTemplate.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish /p:UseAppHost=false

#################################################################
# Final runtime image                                            #
#################################################################
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Environment setup
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .
COPY --from=build /src/client/dist ./client/dist

ENTRYPOINT ["dotnet", "SharpAnglesTemplate.dll"]