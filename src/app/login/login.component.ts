import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService } from "./login.service";
import { UserData, UserType } from "../user/user.models";
import { GoogleAnalyticsUtils } from "../utils/GoogleAnalyticsUtils";
import { RMU } from "../utils/utils";
import { UserDefaults } from "../admin/userDefaults";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginService]
})
export class LoginComponent implements OnInit {
  consent: string = ResmatConfig.app.consent;

  errorMessage: string;
  isStudent: boolean = true;

  isLoading: boolean = false;

  constructor(private router: Router, private loginService: LoginService) { }

  ngOnInit() {
    // this.login("admin", "root");
    // this.login("1");
    const activeView: UserDefaults.Login.LoginActiveView = UserDefaults.Login.getActiveView() || 'student';
    this.isStudent = activeView === 'student'
  }

  switchView() {
    this.isStudent = !this.isStudent;
    UserDefaults.Login.setActiveView(this.isStudent ? 'student' : 'user')
  }

  login(login: string, password?: string) {
    this.isLoading = true;
    this.loginService.login(login, password).subscribe((loggedUser: UserData) => {
      this.isLoading = false;
      console.log('Logged user: ', loggedUser);
      RMU.safe(() => {
        GoogleAnalyticsUtils.setUserId(loggedUser.id);
        GoogleAnalyticsUtils.event("login", `Success user ${loggedUser.id}`, `LoginSuccess`, loggedUser.id);
      });
      switch(loggedUser.userType) {
        case UserType.student:
          this.router.navigate(['users/' + login + '/exams']);
          // this.router.navigate(['users', login, 'exams', 1]);
          break;
        case UserType.assistant:
        case UserType.instructor:
        case UserType.admin:
          this.router.navigate(['/admin']);
          break;
        default:
          throw "Invalid user type: " + loggedUser.userType
      }
    }, error => {
      this.isLoading = false;
      GoogleAnalyticsUtils.event("login", `failed`, `LoginFailed`);
      this.errorMessage = "Логін або пароль не вірні"
    });
  }

}
