# Attack Report 1
**Wits Adventure**  
**22 September 2025**

---

## Introduction

This report is a security audit regarding the supply chain attack on NPM described in the following article:  
👉 [NPM Debug and Chalk Packages Compromised](https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised)

---

## What Caused the Supply Chain Attack?

On **September 8**, Aikido identified **18 popular npm packages** that had been modified to include **malicious JavaScript**.  
The injected code executes in users’ browsers, intercepts **web3/crypto activity**, and silently **redirects transactions** and **approval permissions** to attacker-controlled destinations.

Because these packages collectively see **billions of downloads per week**, the attack had massive potential reach and impact.

---

## List of Compromised Packages and Their Versions

- ansi-styles@6.2.2  
- debug@4.4.2  
- chalk@5.6.1  
- supports-color@10.2.1  
- strip-ansi@7.1.1  
- ansi-regex@6.2.1  
- wrap-ansi@9.0.1  
- color-convert@3.1.1  
- color-name@2.0.1  
- is-arrayish@0.3.3  
- slice-ansi@7.1.1  
- color@5.0.1  
- color-string@2.1.1  
- simple-swizzle@0.2.3  
- supports-hyperlinks@4.1.1  
- has-ansi@6.0.1  
- chalk-template@1.1.1  
- backslash@0.2.1  

---

## What We Can Tell From Our Product/Packages

Using `npm ls` to determine our application’s installed packages, we can see the following:

- @babel/core@7.28.3
- @babel/plugin-transform-modules-commonjs@7.27.1
- @babel/plugin-transform-runtime@7.28.3
- @babel/preset-env@7.28.3
- @babel/preset-react@7.27.1
- @testing-library/dom@10.4.1
- @testing-library/jest-dom@6.8.0
- @testing-library/react@14.3.1
- @testing-library/user-event@14.6.1
- babel-jest@27.5.1
- codecov@3.8.3
- docsify@4.13.1
- firebase@12.0.0
- identity-obj-proxy@3.0.0
- jest-dom@4.0.0
- jest-environment-jsdom@27.5.1
- jest@27.5.1
- jquery@3.7.1
- lucide-react@0.542.0
- react-dom@18.3.1
- react-icons@5.5.0
- react-router-dom@6.30.1
- react-scripts@5.0.1
- react-toastify@11.0.5
- react@18.3.1
- router-dom@3.0.3
- routes@2.1.0
- web-vitals@2.1.4

As we can see, there’s **no overlap** in packages when comparing with the list of compromised packages from NPM.

However, many of those packages (e.g., `ansi-styles`, `chalk`, `strip-ansi`, `color-convert`) are **commonly used as transitive dependencies** by tools like **Babel**, **Jest**, and **React Scripts**.  
That means even if they’re not directly installed, they could still exist deeper in the dependency tree.

Therefore, we used a custom Python tool (`malwareChecker.py`) to inspect our dependency tree.

Fortunately, our application doesn’t depend on any compromised packages — directly or indirectly — and it would likely have been unaffected regardless, as our web app does not involve **real-world financial transactions**.

---

## Algorithm 1 — `malwareChecker`

```python
1: Define list of compromised packages
2: Load package-lock.json as JSON

FindCompromised(dependencies, path)
3: Initialize empty list of matches
4: for all (package, info) in dependencies do
5:     fullPath ← path + package
6:     if package in compromised list then
7:         Add fullPath to matches
8:     end if
9:     if info contains nested dependencies then
10:        Recursively call FindCompromised on nested dependencies
11:        Append results to matches
12:    end if
13: end for
14: return matches

15: Call FindCompromised on root dependencies
16: if any matches found then
17:     Print “Compromised packages found” and list matches
18: else
19:     Print “No compromised packages found”
20: end if
```

---

## Preventive Measures

To protect against infections from upstream sources, the first measure is to **secure your dependency management process**.  
This includes:

- Locking dependencies to **exact versions**  
- Regularly auditing them with tools like `npm audit`, **Snyk**, or **Dependabot**  
- Using **integrity checks** to ensure no tampering has occurred  
- Hosting a **private package registry** or mirroring trusted versions  
- Preventing unverified packages from being pulled from public registries  

The second measure is to **integrate proactive security monitoring** into your workflow.  
Tools like **Aikido SafeChain** or similar wrappers can:
- Intercept package installations  
- Verify packages against **threat intelligence databases** before installation  

When combined with **continuous CI/CD scanning**, **sandboxed testing of updates**, and **reducing unnecessary dependencies**, this approach creates a strong defense against supply chain compromise.

---

# Attack Report 2
**Wits Adventure**  
**15 October 2025**

---

## Introduction
This report is a security audit regarding the supply chain attack on NPM described in the following article:  
👉 [TinyColor Supply Chain Attack Affects 40+ Packages](https://socket.dev/blog/tinycolor-supply-chain-attack-affects-40-packages)

---

## What Caused the Supply Chain Attack?

The TinyColor supply chain attack was caused by **compromised maintainer accounts** across multiple npm packages.  
The attacker gained unauthorized access and published malicious versions of over **40 packages**.

The attack employed a **sophisticated automated trojanization mechanism** — the malicious code included a function called `NpmModule.updatePackage` that:
1. Downloaded a package tarball  
2. Modified its `package.json`  
3. Injected a malicious script (`bundle.js`)  
4. Repacked the archive  
5. Republished it  

This created a **self-propagating attack** that automatically spread to downstream packages.

The **point of failure** was npm’s account security infrastructure, where multiple maintainer credentials were compromised through credential theft, phishing, or weak authentication mechanisms.

---

## List of Compromised Packages and Their Versions

- angulartics2@14.1.2  
- @ctrl/deluge@7.2.2  
- @ctrl/golang-template@1.4.3  
- @ctrl/magnet-link@4.0.4  
- @ctrl/ngx-codemirror@7.0.2  
- @ctrl/ngx-csv@6.0.2  
- @ctrl/ngx-emoji-mart@9.2.2  
- @ctrl/ngx-rightclick@4.0.2  
- @ctrl/qbittorrent@9.7.2  
- @ctrl/react-adsense@2.0.2  
- @ctrl/shared-torrent@6.3.2  
- @ctrl/tinycolor@4.1.1, @4.1.2  
- @ctrl/torrent-file@4.1.2  
- @ctrl/transmission@7.3.1  
- @ctrl/ts-base32@4.0.2  
- encounter-playground@0.0.5  
- json-rules-engine-simplified@0.2.4, 0.2.1  
- koa2-swagger-ui@5.11.2, 5.11.1  
- @nativescript-community/gesturehandler@2.0.35  
- @nativescript-community/sentry@4.6.43  
- @nativescript-community/text@1.6.13  
- @nativescript-community/ui-collectionview@6.0.6  
- @nativescript-community/ui-drawer@0.1.30  
- @nativescript-community/ui-image@4.5.6  
- react-complaint-image@0.0.35  
- @nativescript-community/ui-material-bottomsheet@7.2.72  
- @nativescript-community/ui-material-core@7.2.76  
- @nativescript-community/ui-material-core-tabs@7.2.76  
- ngx-color@10.0.2  
- ngx-toastr@19.0.2  
- ngx-trend@8.0.1  
- react-jsonschema-form-conditionals@0.3.21  
- react-jsonschema-form-extras@1.0.4  
- rxnt-authentication@0.0.6  
- rxnt-healthchecks-nestjs@1.0.5  
- rxnt-kue@1.0.7  
- swc-plugin-component-annotate@1.9.2  
- ts-gaussian@3.0.6  

---

## What We Can Tell From Our Product/Packages

Using `npm ls` to determine our application’s installed packages, we can see the following:

- @babel/core@7.28.3
- @babel/plugin-transform-modules-commonjs@7.27.1
- @babel/plugin-transform-runtime@7.28.3
- @babel/preset-env@7.28.3
- @babel/preset-react@7.27.1
- @testing-library/dom@10.4.1
- @testing-library/jest-dom@6.8.0
- @testing-library/react@14.3.1
- @testing-library/user-event@14.6.1
- babel-jest@27.5.1
- codecov@3.8.3
- docsify@4.13.1
- firebase@12.0.0
- identity-obj-proxy@3.0.0
- jest-dom@4.0.0
- jest-environment-jsdom@27.5.1
- jest@27.5.1
- jquery@3.7.1
- lucide-react@0.542.0
- react-dom@18.3.1
- react-icons@5.5.0
- react-router-dom@6.30.1
- react-scripts@5.0.1
- react-toastify@11.0.5
- react@18.3.1
- router-dom@3.0.3
- routes@2.1.0
- web-vitals@2.1.4

As we can see, there’s **no overlap** in packages when comparing with the list of compromised NPM packages.

Unlike the Aikido attack which targeted commonly used utility packages, the TinyColor attack focused on **specialized packages** (primarily `@ctrl/*` and `@nativescript-community/*` packages).  
However, we must still verify **transitive dependencies**.

---

## Custom Malware Checker Script

Therefore, we used a custom Python tool (`malwareChecker v2.py`) to check the dependencies of our tools.

Fortunately, our application doesn’t depend on any compromised packages either directly or transitively.

The `bundle.js` malware in this attack was particularly dangerous as it:
- Downloaded **TruffleHog** to harvest credentials  
- Created persistent **GitHub Actions workflows** for exfiltration  
- Stole **npm tokens**, **GitHub tokens**, and **cloud credentials**

---

## Algorithm 2 — `malwareChecker v2`

```python
1: Define list of compromised packages (40+ from TinyColor attack)
2: Load package-lock.json as JSON

FindCompromised(dependencies, path)
3: Initialize empty list of matches
4: for all (package, info) in dependencies do
5:     fullPath ← path + package
6:     if package in compromised list then
7:         Add fullPath to matches
8:     end if
9:     if info contains nested dependencies then
10:        Recursively call FindCompromised on nested dependencies
11:        Append results to matches
12:    end if
13: end for
14: return matches

15: Call FindCompromised on root dependencies
16: if any matches found then
17:     Print “Compromised packages found” and list matches
18: else
19:     Print “No compromised packages found”
20: end if
```

## Preventive Measures

To protect against infections from upstream sources, the first measure is to **secure your dependency management process**:

- Lock dependencies to exact versions
- Regularly audit with tools like `npm audit`, Snyk, or Socket Security
- Use integrity checks to detect tampering
- Host a private package registry or mirror trusted versions
- Implement pre-install verification tools that check packages against threat intelligence databases

The second measure is to **protect your development and CI/CD environments from credential theft**:

- Never store production credentials on developer machines or CI/CD environments
- Use scoped npm tokens with minimal permissions
- Enforce multi-factor authentication for all registry accounts
- Regularly rotate credentials
- Consider disabling postinstall scripts using the `--ignore-scripts` flag and reviewing them manually
- Deploy monitoring for unauthorized GitHub Actions workflow creation
- Block access to cloud metadata endpoints (`169.254.169.254`)
- Use endpoint detection, network monitoring, and immutable ephemeral build agents

These combined measures provide a robust defense against both supply chain attacks and subsequent lateral movement.