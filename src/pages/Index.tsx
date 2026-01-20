import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary">
            Accelerate Vocab
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            The engaging vocabulary learning platform designed for students and educators
          </p>
          <div className="flex gap-4 justify-center pt-6">
            <Button size="lg" onClick={() => navigate("/login")} className="shadow-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Admin Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto animate-slide-up">
          <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Interactive Learning</h3>
            <p className="text-muted-foreground">
              Enhance your vocabulary and progress through increasing difficulty levels through interactive learning modules
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Track Your Progress</h3>
            <p className="text-muted-foreground">
              View your performance, review your modules and visualise your progress
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
