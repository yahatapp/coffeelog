{
  description = "Cafelog Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-linux"
    ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        gitleaksVersion = "8.30.0";
        gitleaksArtifacts = {
          aarch64-darwin = {
            archive = "gitleaks_${gitleaksVersion}_darwin_arm64.tar.gz";
            sha256 = "b251ab2bcd4cd8ba9e56ff37698c033ebf38582b477d21ebd86586d927cf87e7";
          };
          x86_64-linux = {
            archive = "gitleaks_${gitleaksVersion}_linux_x64.tar.gz";
            sha256 = "79a3ab579b53f71efd634f3aaf7e04a0fa0cf206b7ed434638d1547a2470a66e";
          };
        };
        gitleaksArtifact = gitleaksArtifacts.${system};
        gitleaksPinned = pkgs.stdenvNoCC.mkDerivation {
          pname = "gitleaks";
          version = gitleaksVersion;
          src = pkgs.fetchurl {
            url = "https://github.com/gitleaks/gitleaks/releases/download/v${gitleaksVersion}/${gitleaksArtifact.archive}";
            sha256 = gitleaksArtifact.sha256;
          };
          sourceRoot = ".";
          installPhase = ''
            runHook preInstall
            install -D -m 0755 gitleaks "$out/bin/gitleaks"
            runHook postInstall
          '';
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bashInteractive
            coreutils
            curl
            git
            gnugrep
            gitleaksPinned
            nodejs_24
            pnpm
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export PATH="''${VP_HOME:-$HOME/.vite-plus}/bin:$PATH"
            echo "☕ Cafelog Dev Environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
          '';
        };
      }
    );
}
