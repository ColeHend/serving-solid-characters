#################################################################
# Build stage for .NET + Client (SolidJS)                        #
#################################################################
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files first for restore caching
COPY SolidCharacters/SolidCharacters.csproj SolidCharacters/
COPY SolidCharacters.Domain/SolidCharacters.Domain.csproj SolidCharacters.Domain/
COPY SolidCharacters.Repository/SolidCharacters.Repository.csproj SolidCharacters.Repository/
RUN dotnet restore "SolidCharacters/SolidCharacters.csproj"

# Copy the rest of the source
COPY . .

# Install Node (use official distro-provided script) for SPA build
RUN apt-get update && apt-get install -y curl gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && npm --version && node --version

# Install client dependencies & build SPA (leveraging package-lock / pnpm lock if present)
WORKDIR /src/SolidCharacters/client
# Using npm; if you migrate to pnpm add it globally and adjust commands
RUN npm install
RUN npm run build

# Return to src dir and publish .NET
WORKDIR /src
RUN dotnet publish "SolidCharacters/SolidCharacters.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish /p:UseAppHost=false

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
COPY --from=build /src/SolidCharacters/client/dist ./client/dist
COPY --from=build /src/SolidCharacters.Repository/data ./data

ENTRYPOINT ["dotnet", "SolidCharacters.dll"]
